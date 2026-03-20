package main

import (
	"archive/zip"
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/template/html/v2"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// Groq Types
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Backup struct {
	ID        int    `json:"id"`
	Filename  string `json:"filename"`
	Size      string `json:"size"`
	Type      string `json:"type"`
	CreatedAt string `json:"created_at"`
}

type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqResponse struct {
	Choices []struct {
		Message GroqMessage `json:"message"`
	} `json:"choices"`
}

func formatSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func listBackups(c *fiber.Ctx) error {
	search := c.Query("search")
	query := "SELECT id, filename, size, type, created_at FROM mcd_backups"
	var args []interface{}

	if search != "" {
		query += " WHERE filename LIKE ?"
		args = append(args, "%"+search+"%")
	}
	query += " ORDER BY created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer rows.Close()

	var backups []Backup
	var lastBackup string = "Never"
	for rows.Next() {
		var b Backup
		var createdAt time.Time
		rows.Scan(&b.ID, &b.Filename, &b.Size, &b.Type, &createdAt)
		b.CreatedAt = createdAt.Format("2006-01-02 15:04")
		backups = append(backups, b)
	}

	// Get last backup time (most recent overall, not just filtered)
	var latest time.Time
	err = db.QueryRow("SELECT created_at FROM mcd_backups ORDER BY created_at DESC LIMIT 1").Scan(&latest)
	if err == nil {
		lastBackup = timeSince(latest)
	}

	data := fiber.Map{
		"Title":      "Backup Management",
		"Active":     "backup",
		"Backups":    backups,
		"LastBackup": lastBackup,
		"Search":     search,
	}

	if c.Get("X-Requested-With") == "XMLHttpRequest" {
		return c.Render("admin/backup", data)
	}

	return c.Render("admin/backup", data)
}

func timeSince(t time.Time) string {
	diff := time.Since(t)
	if diff.Hours() > 24 {
		return fmt.Sprintf("%d days ago", int(diff.Hours()/24))
	} else if diff.Hours() > 1 {
		return fmt.Sprintf("%d hours ago", int(diff.Hours()))
	} else if diff.Minutes() > 1 {
		return fmt.Sprintf("%d minutes ago", int(diff.Minutes()))
	}
	return "Just now"
}

func runBackup(c *fiber.Ctx) error {
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("MCD_BACKUP_%s.zip", timestamp)
	tmpDir := "tmp"
	if _, err := os.Stat(tmpDir); os.IsNotExist(err) {
		os.Mkdir(tmpDir, 0755)
	}

	sqlFile := filepath.Join(tmpDir, "dump.sql")
	zipFile := filepath.Join(tmpDir, filename)

	// 1. Database Dump
	cmd := exec.Command("mysqldump", 
		"-u"+os.Getenv("DB_USER"), 
		"-p"+os.Getenv("DB_PASS"), 
		"-h"+os.Getenv("DB_HOST"), 
		os.Getenv("DB_NAME"))
	
	outFile, err := os.Create(sqlFile)
	if err != nil {
		return c.Status(500).SendString("Failed to create SQL dump file: " + err.Error())
	}
	cmd.Stdout = outFile
	if err := cmd.Run(); err != nil {
		outFile.Close()
		return c.Status(500).SendString("Database dump failed: " + err.Error())
	}
	outFile.Close()

	// 2. Create Zip
	newZipFile, err := os.Create(zipFile)
	if err != nil {
		return c.Status(500).SendString("Failed to create zip file: " + err.Error())
	}
	zipWriter := zip.NewWriter(newZipFile)
	
	f, err := os.Open(sqlFile)
	if err != nil {
		return c.Status(500).SendString("Failed to open SQL file for zipping: " + err.Error())
	}
	w, err := zipWriter.Create("database/sukamcd_db.sql")
	if err != nil {
		return c.Status(500).SendString("Failed to add SQL file to zip: " + err.Error())
	}
	if _, err := io.Copy(w, f); err != nil {
		return c.Status(500).SendString("Failed to copy SQL to zip: " + err.Error())
	}
	f.Close()
	zipWriter.Close()
	newZipFile.Close()

	// 3. Upload to GDrive
	ctx := context.Background()
	srv, err := getDriveService(ctx)
	if err != nil {
		return c.Status(500).SendString("GDrive Service Error: " + err.Error())
	}

	folderID := os.Getenv("GOOGLE_DRIVE_FOLDER_ID")
	driveFile := &drive.File{
		Name:    filename,
		Parents: []string{folderID},
	}

	fToUpload, err := os.Open(zipFile)
	if err != nil {
		return c.Status(500).SendString("Failed to open zip for upload: " + err.Error())
	}
	defer fToUpload.Close()

	fi, _ := fToUpload.Stat()
	size := formatSize(fi.Size())

	_, err = srv.Files.Create(driveFile).Media(fToUpload).Do()
	if err != nil {
		return c.Status(500).SendString("GDrive Upload Error: " + err.Error())
	}

	// 4. Save to DB
	_, err = db.Exec("INSERT INTO mcd_backups (filename, size, type) VALUES (?, ?, ?)", filename, size, "manual")
	if err != nil {
		return c.Status(500).SendString("Database Log Error: " + err.Error())
	}

	// 5. Cleanup
	os.Remove(sqlFile)
	os.Remove(zipFile)

	return c.SendString("Backup Successful")
}

func syncBackups(c *fiber.Ctx) error {
	ctx := context.Background()
	srv, err := getDriveService(ctx)
	if err != nil {
		return c.Status(500).SendString("GDrive Service Error: " + err.Error())
	}

	folderID := os.Getenv("GOOGLE_DRIVE_FOLDER_ID")
	q := fmt.Sprintf("'%s' in parents and trashed = false", folderID)
	r, err := srv.Files.List().Q(q).Fields("files(id, name, size, createdTime)").Do()
	if err != nil {
		return c.Status(500).SendString("GDrive List Error: " + err.Error())
	}

	var driveNames []string
	for _, f := range r.Files {
		if strings.HasPrefix(f.Name, "MCD_BACKUP_") {
			driveNames = append(driveNames, f.Name)
			
			var exists int
			db.QueryRow("SELECT COUNT(*) FROM mcd_backups WHERE filename = ?", f.Name).Scan(&exists)
			if exists == 0 {
				createdAt, _ := time.Parse(time.RFC3339, f.CreatedTime)
				db.Exec("INSERT INTO mcd_backups (filename, size, type, created_at) VALUES (?, ?, ?, ?)", 
					f.Name, formatSize(f.Size), "manual", createdAt)
			}
		}
	}

	// Optional: Delete local records not in Drive
	// db.Exec("DELETE FROM mcd_backups WHERE filename NOT IN (" + strings.Join(qMarks, ",") + ")", driveNames...)

	return c.SendString("Sync Successful")
}

func downloadBackup(c *fiber.Ctx) error {
	filename := c.Params("filename")
	ctx := context.Background()
	srv, err := getDriveService(ctx)
	if err != nil {
		return c.Status(500).SendString("GDrive Service Error: " + err.Error())
	}

	folderID := os.Getenv("GOOGLE_DRIVE_FOLDER_ID")
	q := fmt.Sprintf("name = '%s' and '%s' in parents and trashed = false", filename, folderID)
	r, err := srv.Files.List().Q(q).Do()
	if err != nil || len(r.Files) == 0 {
		return c.Status(404).SendString("File not found on GDrive")
	}

	fileID := r.Files[0].Id
	resp, err := srv.Files.Get(fileID).Download()
	if err != nil {
		return c.Status(500).SendString("Download Error: " + err.Error())
	}
	defer resp.Body.Close()

	c.Set("Content-Type", "application/zip")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	
	_, err = io.Copy(c.Response().BodyWriter(), resp.Body)
	return err
}

func deleteBackup(c *fiber.Ctx) error {
	filename := c.Params("filename")
	ctx := context.Background()
	srv, err := getDriveService(ctx)
	if err != nil {
		return c.Status(500).SendString("GDrive Service Error: " + err.Error())
	}

	folderID := os.Getenv("GOOGLE_DRIVE_FOLDER_ID")
	q := fmt.Sprintf("name = '%s' and '%s' in parents and trashed = false", filename, folderID)
	r, err := srv.Files.List().Q(q).Do()
	if err == nil && len(r.Files) > 0 {
		srv.Files.Delete(r.Files[0].Id).Do()
	}

	db.Exec("DELETE FROM mcd_backups WHERE filename = ?", filename)
	return c.SendString("Deleted")
}

func getDriveService(ctx context.Context) (*drive.Service, error) {
	config := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_DRIVE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_DRIVE_CLIENT_SECRET"),
		Endpoint:     google.Endpoint,
	}

	token := &oauth2.Token{
		RefreshToken: os.Getenv("GOOGLE_DRIVE_REFRESH_TOKEN"),
	}

	tokenSource := config.TokenSource(ctx, token)
	service, err := drive.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, err
	}
	return service, nil
}

func callGroq(apiKey string, messages []GroqMessage, model string) (string, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"
	payload := GroqRequest{
		Model:    model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Groq request: %w", err)
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create Groq request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Groq API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Groq API error: %d - %s", resp.StatusCode, string(bodyBytes))
	}

	var groqResp GroqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		return "", fmt.Errorf("failed to decode Groq response: %w", err)
	}

	if len(groqResp.Choices) > 0 {
		return groqResp.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("no response from AI")
}

var (
	db    *sql.DB
	store *session.Store
)

func main() {
	// Load .env if exists
	godotenv.Load()

	// Initialize standard Go html template engine
	engine := html.New("./views", ".html")

	// Initialize Database
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)
	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize Session Store
	store = session.New()

	app := fiber.New(fiber.Config{
		AppName: "SukaMCD-v2",
		Views:   engine,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			title := "Error"
			message := "Internal Server Error"
			description := "Something went wrong on our server. We are working to fix it."

			switch code {
			case fiber.StatusNotFound:
				title = "Page Not Found"
				message = "We couldn't find that page"
				description = "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
			case fiber.StatusForbidden:
				title = "Access Forbidden"
				message = "You don't have permission"
				description = "Access to this resource is restricted. Please contact an administrator if you believe this is an error."
			}

			return c.Status(code).Render(fmt.Sprintf("errors/%d", code), fiber.Map{
				"Title":       title,
				"Code":        code,
				"Message":     message,
				"Description": description,
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Auth Middleware
	authRequired := func(c *fiber.Ctx) error {
		sess, err := store.Get(c)
		if err != nil {
			return c.Redirect("/admin/login")
		}
		if sess.Get("authenticated") == nil {
			return c.Redirect("/admin/login")
		}
		return c.Next()
	}

	// Public Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("landing", fiber.Map{
			"Title": "SukaMCD v2",
		})
	})

	app.Get("/admin/login", func(c *fiber.Ctx) error {
		return c.Render("admin/login", fiber.Map{
			"Title": "Admin Login",
		})
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		type LoginRequest struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		// Query user from sukamcd_users (email OR username)
		var hashedPassword string
		var userID int
		err := db.QueryRow("SELECT id, password FROM sukamcd_users WHERE email = ? OR username = ?", req.Identifier, req.Identifier).Scan(&userID, &hashedPassword)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}

		// Verify password (bcrypt)
		if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
		}

		// Set session
		sess, _ := store.Get(c)
		sess.Set("authenticated", true)
		sess.Set("user_id", userID)
		sess.Save()

		return c.JSON(fiber.Map{"success": true})
	})

	// Admin Routes (Protected)
	admin := app.Group("/admin", authRequired)
	admin.Get("/dashboard", func(c *fiber.Ctx) error {
		return c.Render("admin/dashboard", fiber.Map{
			"Title":  "Admin Dashboard",
			"Active": "dashboard",
		})
	})

	admin.Get("/mcdai", func(c *fiber.Ctx) error {
		sess, _ := store.Get(c)
		userID := sess.Get("user_id")

		rows, err := db.Query("SELECT id, title FROM mcdai_conversations WHERE user_id = ? ORDER BY updated_at DESC", userID)
		if err != nil {
			return err
		}
		defer rows.Close()

		type Conversation struct {
			ID    int    `json:"id"`
			Title string `json:"title"`
		}
		var conversations []Conversation
		for rows.Next() {
			var conv Conversation
			rows.Scan(&conv.ID, &conv.Title)
			conversations = append(conversations, conv)
		}

		return c.Render("admin/mcdai", fiber.Map{
			"Title":         "McdAI",
			"Active":        "mcdai",
			"Conversations": conversations,
		})
	})

	admin.Get("/mcdai/conversation/:id/messages", func(c *fiber.Ctx) error {
		convID := c.Params("id")
		rows, err := db.Query("SELECT role, content FROM mcdai_messages WHERE conversation_id = ? ORDER BY created_at ASC", convID)
		if err != nil {
			return err
		}
		defer rows.Close()

		type Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}
		var messages []Message
		for rows.Next() {
			var msg Message
			rows.Scan(&msg.Role, &msg.Content)
			messages = append(messages, msg)
		}
		return c.JSON(messages)
	})

	admin.Post("/mcdai/chat", func(c *fiber.Ctx) error {
		type ChatRequest struct {
			Message        string `json:"message"`
			ConversationID *int   `json:"conversation_id"`
			Model          string `json:"model"`
			SystemPrompt   string `json:"system_prompt"`
		}
		var req ChatRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		sess, _ := store.Get(c)
		userID := sess.Get("user_id")

		var convID int
		var convTitle string
		if req.ConversationID == nil {
			// Create new conversation
			title := req.Message
			if len(title) > 30 {
				title = title[:27] + "..."
			}
			res, err := db.Exec("INSERT INTO mcdai_conversations (user_id, title, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", userID, title)
			if err != nil {
				return err
			}
			lastID, _ := res.LastInsertId()
			convID = int(lastID)
			convTitle = title
		} else {
			convID = *req.ConversationID
			db.QueryRow("SELECT title FROM mcdai_conversations WHERE id = ?", convID).Scan(&convTitle)
		}

		// Save User Message
		db.Exec("INSERT INTO mcdai_messages (conversation_id, role, content, created_at, updated_at) VALUES (?, 'user', ?, NOW(), NOW())", convID, req.Message)

		// Fetch History for Context
		rows, _ := db.Query("SELECT role, content FROM mcdai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10", convID)
		var history []GroqMessage
		
		sysPrompt := req.SystemPrompt
		if sysPrompt == "" {
			sysPrompt = "Anda adalah SukaMCD AI, asisten cerdas untuk dashboard SukaMCD. Jawablah dengan sopan, informatif, dan gunakan format Markdown jika diperlukan."
		}
		history = append(history, GroqMessage{Role: "system", Content: sysPrompt})
		
		for rows.Next() {
			var h GroqMessage
			rows.Scan(&h.Role, &h.Content)
			history = append(history, h)
		}
		rows.Close()

		// Call Groq
		apiKey := os.Getenv("GROQ_API_KEY")
		model := req.Model
		if model == "" {
			model = "llama-3.3-70b-versatile"
		}
		
		aiResponse, err := callGroq(apiKey, history, model)
		if err != nil {
			aiResponse = "Maaf, terjadi kesalahan saat menghubungi AI: " + err.Error()
		}

		// Save AI Message
		db.Exec("INSERT INTO mcdai_messages (conversation_id, role, content, created_at, updated_at) VALUES (?, 'assistant', ?, NOW(), NOW())", convID, aiResponse)
		db.Exec("UPDATE mcdai_conversations SET updated_at = NOW() WHERE id = ?", convID)

		return c.JSON(fiber.Map{
			"message": fiber.Map{
				"role":    "assistant",
				"content": aiResponse,
			},
			"conversation": fiber.Map{
				"id":    convID,
				"title": convTitle,
			},
		})
	})

	admin.Delete("/mcdai/conversation/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		db.Exec("DELETE FROM mcdai_messages WHERE conversation_id = ?", id)
		db.Exec("DELETE FROM mcdai_conversations WHERE id = ?", id)
		return c.SendStatus(200)
	})

	admin.Get("/logout", func(c *fiber.Ctx) error {
		sess, _ := store.Get(c)
		sess.Destroy()
		return c.Redirect("/")
	})

	admin.Get("/terminal", func(c *fiber.Ctx) error {
		return c.Render("admin/dashboard", fiber.Map{ // Terminal is currently inside dashboard or should have its own page?
			"Title":  "Terminal",
			"Active": "terminal",
		})
	})

	admin.Post("/terminal", func(c *fiber.Ctx) error {
		type CommandRequest struct {
			Command string `json:"command"`
			Cwd     string `json:"cwd"`
		}

		var req CommandRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}

		if req.Cwd == "" || req.Cwd == "~" {
			req.Cwd, _ = os.Getwd()
		}

		// Handle basic CD (Simplified)
		if strings.HasPrefix(req.Command, "cd ") {
			target := strings.TrimSpace(req.Command[3:])
			if target == "~" {
				target, _ = os.Getwd()
			}
			// Note: This won't work perfectly across requests without state, 
			// but for a single command it's fine.
			return c.JSON(fiber.Map{"output": "", "cwd": target})
		}

		cmd := exec.Command("bash", "-c", req.Command)
		cmd.Dir = req.Cwd
		output, err := cmd.CombinedOutput()

		return c.JSON(fiber.Map{
			"output": string(output),
			"error":  err != nil,
			"cwd":    req.Cwd,
		})
	})

	// Backup Routes
	admin.Get("/backup", listBackups)
	admin.Post("/backup/sync", syncBackups)
	admin.Post("/backup/run", runBackup)
	admin.Get("/backup/download/:filename", downloadBackup)
	admin.Delete("/backup/:filename", deleteBackup)

	// Placeholder for AI and Admin routes
	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(app.Listen(":" + port))
}

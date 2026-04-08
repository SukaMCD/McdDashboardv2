import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Inisialisasi Google Drive API Client menggunakan OAuth2
 */
export async function getGDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    // Redirect URI tidak diperlukan untuk refresh token flow secara terprogram, 
    // tapi biasanya menggunakan Playground URI jika diperlukan saat setup
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Fungsi untuk mengunggah stream file ke folder spesifik di Google Drive
 */
export async function uploadToDrive(
  filename: string, 
  contentStream: Readable, 
  mimeType: string = "application/zip"
) {
  const drive = await getGDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : [],
    },
    media: {
      mimeType: mimeType,
      body: contentStream,
    },
  });

  return response.data;
}

/**
 * Helper untuk format nama file sesuai permintaan: MCD_BACKUP_YYYYMMDD_HHMMSS.zip
 */
export function generateBackupFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `MCD_BACKUP_${year}${month}${day}_${hours}${minutes}${seconds}.zip`;
}

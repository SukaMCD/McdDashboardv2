import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Mendapatkan encryption key dari environment variable.
 * Menghasilkan hash SHA-256 agar panjangnya tepat 32 byte.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ADMIN_ACCESS_KEY || "default_fallback_key_change_me";
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Mengenkripsi buffer menggunakan AES-256-CBC.
 * Hasilnya adalah (IV + EncryptedContent) dalam bentuk Buffer.
 */
export function encryptBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Gabungkan IV di awal buffer agar bisa dibaca saat dekripsi
  return Buffer.concat([iv, encrypted]);
}

/**
 * Mendekripsi buffer yang dihasilkan oleh encryptBuffer.
 */
export function decryptBuffer(combinedBuffer: Buffer): Buffer {
  const iv = combinedBuffer.subarray(0, IV_LENGTH);
  const encrypted = combinedBuffer.subarray(IV_LENGTH);
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

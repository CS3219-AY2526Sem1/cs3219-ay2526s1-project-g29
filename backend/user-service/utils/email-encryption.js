import crypto from "crypto";

let cachedConfig;

function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const keyEncoded = process.env.EMAIL_ENCRYPTION_KEY;
  const ivEncoded = process.env.EMAIL_ENCRYPTION_IV;

  if (!keyEncoded || !ivEncoded) {
    throw new Error(
      "EMAIL_ENCRYPTION_KEY and EMAIL_ENCRYPTION_IV must be set for email encryption"
    );
  }

  const key = Buffer.from(keyEncoded, "base64");
  const iv = Buffer.from(ivEncoded, "base64");

  if (key.length !== 32) {
    throw new Error("EMAIL_ENCRYPTION_KEY must decode to 32 bytes (AES-256 key)");
  }

  if (iv.length !== 16) {
    throw new Error("EMAIL_ENCRYPTION_IV must decode to 16 bytes (AES IV)");
  }

  cachedConfig = { key, iv };
  return cachedConfig;
}

export function encryptEmail(email) {
  if (typeof email !== "string") {
    throw new Error("Email must be a string to encrypt");
  }

  const { key, iv } = loadConfig();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(email, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function decryptEmail(encryptedEmail) {
  if (typeof encryptedEmail !== "string") {
    throw new Error("Encrypted email must be a string to decrypt");
  }

  const { key, iv } = loadConfig();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedEmail, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function getEmailHash(email) {
  if (typeof email !== "string") {
    throw new Error("Email must be a string to hash");
  }

  return crypto.createHash("sha256").update(email).digest("hex");
}

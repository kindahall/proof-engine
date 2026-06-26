import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

const algorithm = "aes-256-gcm"
const fallbackKeyMaterial = "proof-engine-local-development-key"

function getKeyMaterial() {
  const configured = process.env.APP_ENCRYPTION_KEY
  if (configured) return configured
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ENCRYPTION_KEY is required in production.")
  }
  return fallbackKeyMaterial
}

function deriveKey() {
  return scryptSync(getKeyMaterial(), "proof-engine-secret-v1", 32)
}

export function encryptSecret(payload: unknown, keyVersion = 1) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, deriveKey(), iv)
  const serialized = JSON.stringify(payload)
  const encrypted = Buffer.concat([cipher.update(serialized, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    keyVersion,
    encryptedPayload: Buffer.concat([iv, authTag, encrypted]).toString("base64"),
  }
}

export function decryptSecret<T>(encryptedPayload: string): T {
  const buffer = Buffer.from(encryptedPayload, "base64")
  const iv = buffer.subarray(0, 12)
  const authTag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = createDecipheriv(algorithm, deriveKey(), iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  return JSON.parse(decrypted) as T
}

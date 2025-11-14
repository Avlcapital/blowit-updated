// backend/config/ipay.js
import crypto from "crypto";

const IPAY_VENDOR_ID = process.env.IPAY_VENDOR_ID;
const IPAY_HASH_KEY = process.env.IPAY_HASH_KEY;
const IPAY_LIVE = process.env.IPAY_LIVE === "true";

// iPay endpoints
export const IPAY_BASE_URL = IPAY_LIVE
  ? "https://payments.ipayafrica.com/v3/ke"
  : "https://payments.ipayafrica.com/v3/ke";

export const IPAY_INIT_URL = `${IPAY_BASE_URL}/payments`;

// Generate HMAC or MD5 hash depending on how your iPay account is configured
// Here we assume concatenated string then HMAC-SHA256 (safer than MD5).
export function generateIpayHash(fields) {
  // fields is an object of key -> value in correct order
  const concatenated = Object.values(fields).join("");
  return crypto
    .createHmac("sha256", IPAY_HASH_KEY)
    .update(concatenated)
    .digest("hex");
}

export const IPAY_VENDOR = IPAY_VENDOR_ID;

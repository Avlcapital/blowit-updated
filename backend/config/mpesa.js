import axios from "axios";

const {
  MPESA_ENV = "sandbox", // "sandbox" or "production"
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL, // e.g. https://api.blowit.africa/api/payments/mpesa/callback
} = process.env;

const baseURL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export const mpesaAuthToken = async () => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const res = await axios.get(`${baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return res.data.access_token;
};

export const mpesaPasswordAndTimestamp = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  return { password, timestamp };
};

export const mpesaConfig = {
  baseURL,
  MPESA_SHORTCODE,
  MPESA_CALLBACK_URL,
};

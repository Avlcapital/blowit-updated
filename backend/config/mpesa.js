import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const DEFAULT_SANDBOX_SHORTCODE = "174379";
const DEFAULT_SANDBOX_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

const getMpesaEnv = () => ({
  MPESA_ENV: (process.env.MPESA_ENV || "sandbox").toLowerCase(),
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || "",
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || "",
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || "",
  MPESA_PASSKEY: process.env.MPESA_PASSKEY || "",
  MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL || "",
});

const getConfiguredPaybillNo = () => String(process.env.PAYBILL_NO || "").trim();

const isSandboxCredentialSet = (env) =>
  env.MPESA_SHORTCODE === DEFAULT_SANDBOX_SHORTCODE ||
  env.MPESA_PASSKEY === DEFAULT_SANDBOX_PASSKEY;

const getShortcodeMismatchMessage = () => {
  const env = getResolvedMpesaEnv();
  const paybillNo = getConfiguredPaybillNo();

  if (!paybillNo || !env.MPESA_SHORTCODE || paybillNo === env.MPESA_SHORTCODE) {
    return "";
  }

  return `M-Pesa configuration mismatch: PAYBILL_NO (${paybillNo}) differs from MPESA_SHORTCODE (${env.MPESA_SHORTCODE}). Safaricom STK push expects the business shortcode and credited shortcode to match. Set MPESA_SHORTCODE and MPESA_PASSKEY to the live credentials for ${paybillNo}.`;
};

const getResolvedMpesaEnv = () => {
  const env = getMpesaEnv();
  const inferredSandbox = isSandboxCredentialSet(env);

  if (env.MPESA_ENV === "production" && inferredSandbox) {
    return {
      ...env,
      MPESA_ENV: "sandbox",
      inferredSandbox: true,
    };
  }

  return {
    ...env,
    inferredSandbox: false,
  };
};

const getMpesaBaseUrl = () => {
  const { MPESA_ENV } = getResolvedMpesaEnv();
  return MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
};

const assertMpesaConfig = () => {
  const env = getResolvedMpesaEnv();
  const required = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL",
  ];

  const missing = required.filter((key) => !env[key]);

  if (missing.length) {
    throw new Error(
      `Missing M-Pesa configuration: ${missing.join(", ")}`
    );
  }

  return env;
};

export const mpesaConfig = {
  get baseURL() {
    return getMpesaBaseUrl();
  },
  get resolvedEnv() {
    return getResolvedMpesaEnv().MPESA_ENV;
  },
  get MPESA_SHORTCODE() {
    return getResolvedMpesaEnv().MPESA_SHORTCODE;
  },
  get MPESA_CALLBACK_URL() {
    return getResolvedMpesaEnv().MPESA_CALLBACK_URL;
  },
  get PAYBILL_NO() {
    return getConfiguredPaybillNo();
  },
  get shortcodeMismatchMessage() {
    return getShortcodeMismatchMessage();
  },
  get hasShortcodeMismatch() {
    return Boolean(getShortcodeMismatchMessage());
  },
  get isSandbox() {
    return getResolvedMpesaEnv().MPESA_ENV !== "production";
  },
  get isInferredSandbox() {
    return Boolean(getResolvedMpesaEnv().inferredSandbox);
  },
};

export const mpesaAuthToken = async () => {
  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    inferredSandbox,
  } = assertMpesaConfig();

  if (inferredSandbox) {
    console.warn(
      "M-Pesa config warning: production mode was requested, but sandbox shortcode/passkey values were detected. Using sandbox endpoint instead."
    );
  }

  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    }
  );

  return res.data.access_token;
};

export const mpesaPasswordAndTimestamp = () => {
  const { MPESA_SHORTCODE, MPESA_PASSKEY } = assertMpesaConfig();

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  return { password, timestamp };
};

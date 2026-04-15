import mongoose from "mongoose";

const DNS_ERROR_PATTERN = /querySrv|queryTxt|ETIMEOUT|ENOTFOUND|EAI_AGAIN/i;

const getMongoOptions = () => ({
  family: 4,
  serverSelectionTimeoutMS: Number(
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 8000
  ),
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 8000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 20000),
});

const redactMongoUri = (uri = "") =>
  uri.replace(/\/\/([^:/?#]+):([^@]+)@/, "//$1:****@");

const isSrvLookupError = (error) =>
  DNS_ERROR_PATTERN.test(error?.message || "") ||
  DNS_ERROR_PATTERN.test(error?.code || "");

const connectWithUri = async (uri, label) => {
  await mongoose.connect(uri, getMongoOptions());
  console.log(`MongoDB connected successfully via ${label}`);
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const directUri = process.env.MONGO_URI_DIRECT;
  const preferDirect =
    process.env.MONGO_PREFER_DIRECT !== "false" && Boolean(directUri);

  if (!primaryUri && !directUri) {
    throw new Error(
      "MongoDB connection string is missing. Set MONGO_URI or MONGO_URI_DIRECT."
    );
  }

  try {
    if (preferDirect) {
      await connectWithUri(directUri, "direct URI");
      return;
    }

    if (!primaryUri && directUri) {
      await connectWithUri(directUri, "direct URI");
      return;
    }

    await connectWithUri(primaryUri, "SRV URI");
  } catch (error) {
    if (preferDirect || !directUri || !primaryUri || !isSrvLookupError(error)) {
      throw error;
    }

    console.warn(
      `MongoDB SRV lookup failed (${error.message}). Retrying with direct hosts: ${redactMongoUri(
        directUri
      )}`
    );

    await connectWithUri(directUri, "direct host fallback");
  }
};

export default connectDB;

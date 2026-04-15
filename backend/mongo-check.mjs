import dotenv from "dotenv";

dotenv.config();

const [{ default: connectDB }, { default: mongoose }] = await Promise.all([
  import("./config/db.js"),
  import("mongoose"),
]);

console.log("Starting Mongo connectivity check...");

try {
  await connectDB();
  console.log("Mongo connectivity check passed.");
} catch (error) {
  console.error("Mongo connectivity check failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

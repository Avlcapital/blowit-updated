import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    password: { type: String, required: true },
    kyc: {
      idType: String,
      idNumber: String,
      kraPin: String,
      address: String,
      documents: [String],
    },
    otp: String,
    otpExpires: Date,
    favourites: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  }
],
  },
  { timestamps: true }
);

// Encrypt password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);

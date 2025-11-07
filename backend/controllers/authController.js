import jwt from "jsonwebtoken";
import User from "../models/User.js";
import otpGenerator from "otp-generator";
import { sendOTPEmail } from "../utils/emailService.js";
import bcrypt from "bcryptjs";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, phone, password });
    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// STEP 1: User logs in with email/password
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate OTP for 2FA
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false });
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    await user.save();

    await sendOTPEmail(email, otp);

    // Send partial success (wait for OTP)
    res.json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      stage: "otp_pending",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// STEP 2: Verify OTP and issue JWT
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // Clear OTP fields after success
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otpGenerator.generate(6, { digits: true, alphabets: false });
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
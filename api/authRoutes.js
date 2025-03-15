const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const transporter = require("../config/email"); // Import module gửi email
const authMiddleware = require("../middleware/auth.middleware");
const { default: mongoose } = require("mongoose");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

//  Đăng ký tài khoản
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, boards } = req.body;

    // Kiểm tra nếu email đã tồn tại
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    // Tạo user mới
    const newUser = new User({ username, email, password, role, boards });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {

    res.status(500).json({ message: "Server error" });
  }
});

//  Đăng nhập & cấp JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra user
    const user = await User.findOne({ email }).populate({
      path: "project",
      select: "_id projectName",
      populate: {
        path: "projectBoards",
        select: "_id title",
      },
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Tạo JWT
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .json({ token, username: user.username, project: user.project });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//  API test: Truy cập chỉ khi có JWT
router.get("/protected", authMiddleware, (req, res) => {
  res.status(200).json({ message: "Protected route accessed", user: req.user });
});

//  Quên mật khẩu - Gửi email reset password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Email not found" });

    // Tạo token reset password (có hạn 15 phút)
    const resetToken = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "15m",
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    // Gửi email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Click vào link sau để đặt lại mật khẩu: ${resetLink}`,
    });

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//  Đặt lại mật khẩu (Reset Password)
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(400).json({ message: "Invalid token" });

    // Cập nhật mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

//  Đổi mật khẩu (Change Password - yêu cầu đăng nhập)
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    // Cập nhật mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) throw new Error("User not authenticated");
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    const user = await User.findById(userId).populate("project");

    if (!user) {
      throw new Error("User not found");
    }
    res
      .status(200)
      .json({ message: "Get User was successfully", metadata: user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;

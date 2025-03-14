const User = require("../models/user.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

class UserService {
  // Đăng ký user mới
  async register({ username, email, password, role }) {
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required");
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const newUser = new User({
      username,
      email,
      password,
      role: role || "User",
    });

    const savedUser = await newUser.save();

    return await User.findById(savedUser._id).populate("project");
  }

  // Đăng nhập
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).populate("project");
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    return user;
  }

  // Lấy thông tin user theo ID
  async getUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId).populate("project");
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Cập nhật thông tin user
  async updateUser(userId, updates) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Nếu cập nhật mật khẩu, mã hóa lại
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).populate("project");

    return updatedUser;
  }

  // Xóa user
  async deleteUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await User.findByIdAndDelete(userId);
    return { deletedUserId: userId };
  }
}

module.exports = new UserService();

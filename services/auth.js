const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
  BadRequestError,
  UnprocessableEntityError,
  NotFoundError,
} = require("../core/response/error.response");

class AuthService {
  // Sign Up
  async signUp({ username, email, password }) {
    // Input validation
    if (!username || !email || !password) {
      throw new BadRequestError("Username, email, and password are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new UnprocessableEntityError("Username or email already exists");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return { userId: user._id, username: user.username, token };
  }

  // Login
  async login({ email, password }) {
    // Input validation
    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password"); // Ensure password is selected
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return { userId: user._id, username: user.username, token };
  }

  // Logout
  async logout(user) {
    // Since JWT is stateless, logout is typically handled client-side by discarding the token.
    // If you want server-side token invalidation (e.g., using a blacklist), you’d need additional infrastructure.
    // For now, return a simple success response.
    if (!user || !user.userId) {
      throw new BadRequestError("User information not provided");
    }

    // Placeholder for potential token blacklist implementation
    // Example: await TokenBlacklist.create({ token: user.token, userId: user.userId });

    return { userId: user.userId, message: "Logged out successfully" };
  }
}

module.exports = new AuthService();
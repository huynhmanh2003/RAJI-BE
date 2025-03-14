const { OK, CREATED } = require("../core/response/success.response");
const userService = require("../services/user.service");
const jwt = require("jsonwebtoken");

class UserController {
  // Đăng ký user
  register = async (req, res, next) => {
    const { username, email, password, role } = req.body;
    const result = new CREATED({
      message: "User registered successfully",
      metadata: await userService.register({ username, email, password, role }),
    });
    result.send(res);
  };

  // Đăng nhập
  login = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await userService.login({ email, password });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const result = new OK({
      message: "Login successful",
      metadata: { token, user },
    });
    result.send(res);
  };

  // Lấy thông tin user
  getUserProfile = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "User profile retrieved successfully",
      metadata: await userService.getUserById(userId),
    });
    result.send(res);
  };

  // Cập nhật thông tin user
  updateUser = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "User updated successfully",
      metadata: await userService.updateUser(userId, req.body),
    });
    result.send(res);
  };

  // Xóa user
  deleteUser = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "User deleted successfully",
      metadata: await userService.deleteUser(userId),
    });
    result.send(res);
  };
}

module.exports = new UserController();
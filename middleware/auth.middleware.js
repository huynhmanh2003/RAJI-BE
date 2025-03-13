const jwt = require("jsonwebtoken"); // Import jsonwebtoken
require("dotenv").config(); // Import dotenv để tải biến môi trường

const authMiddleware = (req, res, next) => {
  // Lấy token từ header Authorization (giả định định dạng "Bearer token")
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;

const jwt = require("jsonwebtoken");

const authentication = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Lấy token từ header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gán thông tin user vào req
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

module.exports = { authentication };

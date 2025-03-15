const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
});

// Test kết nối (giữ nguyên)
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Server is ready to send emails:", success);
  }
});

module.exports = transporter;
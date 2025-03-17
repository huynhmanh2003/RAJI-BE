const transporter = require("../config/email"); // Import transporter từ config

const sendInviteEmail = async (toEmail, inviteId) => {
  const acceptLink = `${process.env.BASE_URL}/api/project/invite/${inviteId}/accept`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Bạn được mời tham gia vào một dự án!",
    html: `
            <p>Bạn đã được mời tham gia một dự án.</p>
            <p>Nhấn vào link sau để chấp nhận lời mời:</p>
            <a href="${acceptLink}" target="_blank">${acceptLink}</a>
        `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInviteEmail };

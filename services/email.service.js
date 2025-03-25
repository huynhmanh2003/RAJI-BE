const transporter = require("../config/email"); // Import transporter từ config
const { loadTemplate } = require("../utils/emailTemplate")

const sendInviteEmail = async (clientURL, toEmail, inviteId) => {

  const acceptLink = `${clientURL}/project-invitation?inviteId=${inviteId}`;
  const template = loadTemplate("project-invitation-template.html", {
    ACCEPT_LINK: acceptLink
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Bạn được mời tham gia vào một dự án!",
    html: template,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInviteEmail };

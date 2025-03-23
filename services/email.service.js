const transporter = require("../config/email"); // Import transporter từ config

const sendInviteEmail = async (clientURL, toEmail, inviteId) => {
  const acceptLink = `${clientURL}/api/projects/invite/${inviteId}/accept`;

  // Load and compile HTML template
  const loadTemplate = (filePath, replacements) => {
    let template = fs.readFileSync(filePath, "utf8");
    for (let key in replacements) {
      template = template.replace(
        new RegExp(`{{${key}}}`, "g"),
        replacements[key]
      );
    }
    return template;
  };

  const templatePath = path.join(
    __dirname,
    "templates",
    "project-invitation.html"
  );
  const emailHtml = loadTemplate(templatePath, { resetLink });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Bạn được mời tham gia vào một dự án!",
    html: emailHtml,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInviteEmail };

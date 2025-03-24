const fs = require("fs");
const path = require("path");

const loadTemplate = (fileName, replacements) => {
  const filePath = path.join(__dirname, "../templates", fileName);
  let template = fs.readFileSync(filePath, "utf8");

  for (let key in replacements) {
    template = template.replace(
      new RegExp(`{{${key}}}`, "g"),
      replacements[key]
    );
  }

  return template;
};

module.exports = { loadTemplate };

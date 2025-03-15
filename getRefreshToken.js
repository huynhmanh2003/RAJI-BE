require("dotenv").config();
const { google } = require("googleapis");

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000"
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("Authorize this app by visiting this URL:", url);

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Enter the code from that page here: ", (code) => {
  readline.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error("Error retrieving access token:", err);
      return;
    }
    console.log("Tokens retrieved:", token);
    if (token.refresh_token) {
      console.log("Refresh Token:", token.refresh_token);
    } else {
      console.warn("No refresh token received. Ensure 'access_type: offline' is used and consent is granted.");
    }
  });
});
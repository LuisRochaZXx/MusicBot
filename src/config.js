const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const required = ["DISCORD_TOKEN", "CLIENT_ID"];
const missing = required.filter((key) => !process.env[key]);
const placeholders = [
  "cole_o_token_do_bot_aqui",
  "cole_o_application_client_id_aqui",
  "cole_o_id_do_servidor_aqui",
];
const unchanged = ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"].filter((key) =>
  placeholders.includes(process.env[key])
);

if (missing.length > 0) {
  throw new Error(`Variaveis ausentes no .env: ${missing.join(", ")}`);
}

if (unchanged.length > 0) {
  throw new Error(
    `Troque os valores de exemplo no .env antes de rodar: ${unchanged.join(", ")}`
  );
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  youtubeCookie: process.env.YOUTUBE_COOKIE || null,
  youtubeCookieFile: process.env.YOUTUBE_COOKIE_FILE || null,
  youtubeCookies: process.env.YOUTUBE_COOKIES || null,
  youtubeCookiesBase64: process.env.YOUTUBE_COOKIES_BASE64 || null,
};

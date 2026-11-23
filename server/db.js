const mysql = require("mysql2/promise");

const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}. Copy .env.example to .env and configure it.`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  dateStrings: true,
});

module.exports = pool;

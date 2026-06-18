require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 3306,
      ssl: { rejectUnauthorized: false }
    });

    console.log(`Connected to database: ${process.env.DB_NAME}`);

    console.log("Making password_hash nullable...");
    try {
      await connection.query("ALTER TABLE users MODIFY COLUMN password_hash TEXT NULL");
      console.log("Success!");
    } catch (e) { console.log("Skipped or Error:", e.message); }

    console.log("Adding auth_provider column...");
    try {
      await connection.query("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'");
      console.log("Success!");
    } catch (e) { console.log("Skipped or Error:", e.message); }

    console.log("Adding google_id column...");
    try {
      await connection.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)");
      console.log("Success!");
    } catch (e) { console.log("Skipped or Error:", e.message); }

    console.log("All done! You can close this.");
    await connection.end();
  } catch (error) {
    console.error('Connection Error:', error.message);
  }
}

fixDb();

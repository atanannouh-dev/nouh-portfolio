require("dotenv").config();

const bcrypt = require("bcryptjs");
const readline = require("readline");
const pool = require("./db");

function ask(question, hidden) {
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    output.write(question);

    if (!hidden || !input.isTTY) {
      const rl = readline.createInterface({ input, output });
      rl.once("line", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    let answer = "";
    function onData(char) {
      if (char === "\u0003") {
        input.setRawMode(false);
        input.pause();
        process.exit(1);
      }
      if (char === "\r" || char === "\n") {
        input.removeListener("data", onData);
        input.setRawMode(false);
        input.pause();
        output.write("\n");
        resolve(answer);
      } else if (char === "\u007f" || char === "\b") {
        answer = answer.slice(0, -1);
      } else {
        answer += char;
      }
    }
    input.on("data", onData);
  });
}

async function main() {
  const username = await ask("Admin username: ");
  const password = await ask("Admin password (hidden): ", true);
  if (!username || password.length < 12) {
    throw new Error("Username is required and password must contain at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute(
    "INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
    [username, passwordHash]
  );
  console.log(`Admin account "${username}" is ready.`);
}

main()
  .catch((error) => {
    console.error("Could not create admin:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

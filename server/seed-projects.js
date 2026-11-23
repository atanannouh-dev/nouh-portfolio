require("dotenv").config();

const projects = require("../src/data/projects.json");
const pool = require("./db");

async function seedProjects() {
  const [[existing]] = await pool.query("SELECT COUNT(*) AS count FROM projects");
  if (Number(existing.count) > 0) {
    console.log("Projects table already has data; no starter projects were added.");
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const project of projects) {
      const [result] = await connection.execute(
        `INSERT INTO projects (title, description, github_url, demo_url, screenshot_path)
         VALUES (?, ?, ?, ?, ?)`,
        [project.title, project.description, project.github || "", project.demo || "", project.screenshot || null]
      );
      for (const name of project.technologies) {
        await connection.execute("INSERT IGNORE INTO technologies (name) VALUES (?)", [name]);
        const [[technology]] = await connection.execute("SELECT id FROM technologies WHERE name = ?", [name]);
        await connection.execute(
          "INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)",
          [result.insertId, technology.id]
        );
      }
    }
    await connection.commit();
    console.log(`Added ${projects.length} starter project(s).`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

seedProjects()
  .catch((error) => {
    console.error("Could not seed projects:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

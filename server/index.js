require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const rateLimit = require("express-rate-limit").rateLimit;
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const pool = require("./db");
const { requireAdmin } = require("./auth");
const assistantRouter = require("./assistant");
const defaultContent = require("../src/data/portfolioContent.json");

const app = express();
const port = Number(process.env.API_PORT || 5000);
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));
app.use("/api/assistant", assistantRouter);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${require("crypto").randomBytes(12).toString("hex")}${extension}`);
  },
});

function createUploader(allowedTypes, maxSize) {
  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, callback) => {
      if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Unsupported file type.");
        error.status = 400;
        return callback(error);
      }
      return callback(null, true);
    },
  });
}

const imageUpload = createUploader(["image/jpeg", "image/png", "image/webp"], 5 * 1024 * 1024);
const documentUpload = createUploader(["application/pdf", "image/jpeg", "image/png", "image/webp"], 10 * 1024 * 1024);
const cvUpload = createUploader(["application/pdf"], 10 * 1024 * 1024);
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "Too many messages. Please try again later." }),
});

async function initializeContentStorage() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS site_content (
      content_key VARCHAR(50) PRIMARY KEY,
      content_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`
  );
  await pool.execute(
    "INSERT IGNORE INTO site_content (content_key, content_json) VALUES ('portfolio', ?)",
    [JSON.stringify(defaultContent)]
  );
}

function normalizeContent(input) {
  const invalid = new Error("Portfolio content has an invalid format.");
  invalid.status = 400;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid;
  const info = input.personalInfo;
  if (!info || typeof info !== "object" || Array.isArray(info)) throw invalid;

  const personalInfo = {};
  for (const key of ["name", "field", "role", "location", "about"]) {
    if (typeof info[key] !== "string") throw invalid;
    personalInfo[key] = info[key].trim();
  }
  const contactInput = input.contact === undefined ? defaultContent.contact : input.contact;
  if (!contactInput || typeof contactInput !== "object" || Array.isArray(contactInput)) throw invalid;
  const contact = {};
  for (const key of ["phone", "email", "whatsapp", "github", "linkedin", "instagram"]) {
    const value = contactInput[key] === undefined ? defaultContent.contact[key] : contactInput[key];
    if (typeof value !== "string") throw invalid;
    contact[key] = value.trim();
    if (contact[key].length > (key === "phone" ? 40 : key === "email" ? 254 : 500)) throw invalid;
    if (key === "email" && contact[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact[key])) {
      const error = new Error("Enter a valid contact email.");
      error.status = 400;
      throw error;
    }
    if (["whatsapp", "github", "linkedin", "instagram"].includes(key) && contact[key]) {
      let url;
      try {
        url = new URL(contact[key]);
      } catch {
        throw invalid;
      }
      if (!["http:", "https:"].includes(url.protocol)) throw invalid;
    }
  }
  if (!input.skills || typeof input.skills !== "object" || Array.isArray(input.skills)) throw invalid;
  const skills = {};
  for (const [category, items] of Object.entries(input.skills)) {
    if (!category.trim() || !Array.isArray(items) || items.some((item) => typeof item !== "string")) throw invalid;
    skills[category.trim()] = items.map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(input.services) || input.services.some((service) => typeof service !== "string")) throw invalid;
  return {
    personalInfo,
    contact,
    skills,
    services: input.services.map((service) => service.trim()).filter(Boolean),
  };
}

function fileUrl(fileName) {
  return fileName ? `/uploads/${encodeURIComponent(fileName)}` : "";
}

function storedFileName(filePath) {
  if (!filePath || !filePath.startsWith("/uploads/")) return null;
  const fileName = path.basename(decodeURIComponent(filePath.slice("/uploads/".length)));
  return fileName === path.basename(filePath.slice("/uploads/".length)) ? fileName : null;
}

function removeUploadedFile(filePath) {
  const fileName = storedFileName(filePath);
  if (!fileName) return;
  fs.promises.unlink(path.join(uploadDir, fileName)).catch((error) => {
    if (error.code !== "ENOENT") console.error("Could not remove uploaded file:", error.message);
  });
}

function publicProject(row) {
  const screenshot = row.screenshot_path || "";
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    technologies: row.technologies || [],
    github: row.github_url || "",
    demo: row.demo_url || "",
    screenshot: screenshot.startsWith("http") ? screenshot : fileUrl(screenshot),
  };
}

async function getProjects(publishedOnly) {
  const where = publishedOnly ? "WHERE p.is_published = TRUE" : "";
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.description, p.github_url, p.demo_url, p.screenshot_path
     FROM projects p ${where}
     ORDER BY p.sort_order, p.id`
  );
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const [technologyRows] = await pool.execute(
    `SELECT pt.project_id, t.name
     FROM project_technologies pt
     JOIN technologies t ON t.id = pt.technology_id
     WHERE pt.project_id IN (${placeholders})
     ORDER BY t.name`,
    ids
  );
  const technologiesByProject = new Map();
  technologyRows.forEach((row) => {
    const technologies = technologiesByProject.get(row.project_id) || [];
    technologies.push(row.name);
    technologiesByProject.set(row.project_id, technologies);
  });
  return rows.map((row) => publicProject({
    ...row,
    technologies: technologiesByProject.get(row.id) || [],
  }));
}

async function saveProject(project, id) {
  const title = String(project.title || "").trim();
  if (!title) {
    const error = new Error("Project title is required.");
    error.status = 400;
    throw error;
  }
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.map((name) => String(name).trim()).filter(Boolean)
    : [];
  const screenshot = String(project.screenshot || "");
  const screenshotPath = screenshot.startsWith("/uploads/")
    ? storedFileName(screenshot)
    : screenshot;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    let projectId = id;
    if (id) {
      const [result] = await connection.execute(
        `UPDATE projects
         SET title = ?, description = ?, github_url = ?, demo_url = ?, screenshot_path = ?
         WHERE id = ?`,
        [title, project.description || "", project.github || "", project.demo || "", screenshotPath || null, id]
      );
      if (!result.affectedRows) {
        const error = new Error("Project not found.");
        error.status = 404;
        throw error;
      }
    } else {
      const [result] = await connection.execute(
        `INSERT INTO projects (title, description, github_url, demo_url, screenshot_path)
         VALUES (?, ?, ?, ?, ?)`,
        [title, project.description || "", project.github || "", project.demo || "", screenshotPath || null]
      );
      projectId = result.insertId;
    }

    await connection.execute("DELETE FROM project_technologies WHERE project_id = ?", [projectId]);
    for (const name of technologies) {
      await connection.execute("INSERT IGNORE INTO technologies (name) VALUES (?)", [name]);
      const [[technology]] = await connection.execute("SELECT id FROM technologies WHERE name = ?", [name]);
      await connection.execute(
        "INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)",
        [projectId, technology.id]
      );
    }
    await connection.commit();
    return projectId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/content", async (_req, res, next) => {
  try {
    const [[row]] = await pool.execute("SELECT content_json FROM site_content WHERE content_key = 'portfolio'");
    if (!row) return res.status(404).json({ error: "Portfolio content has not been initialized." });
    return res.json(normalizeContent({ ...defaultContent, ...JSON.parse(row.content_json) }));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const invalidMessage = "Enter a name, valid email, subject, and message.";
  if (
    !name || !subject || !message ||
    name.length > 100 || email.length > 254 || subject.length > 200 || message.length > 5000 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[\r\n\u0000-\u001f\u007f]/.test(name + subject)
  ) {
    return res.status(400).json({ error: invalidMessage });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(503).json({ error: "Contact email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the server .env file." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: { name: "Nouh Portfolio", address: process.env.GMAIL_USER },
      to: process.env.CONTACT_TO_EMAIL || process.env.GMAIL_USER,
      replyTo: { name, address: email },
      subject: `Portfolio contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    return res.json({ message: "Your message was sent." });
  } catch (error) {
    console.error("Could not send portfolio contact email:", error.message);
    return res.status(502).json({ error: "Could not send your message right now. Please try again later." });
  }
});

app.put("/api/content", requireAdmin, async (req, res, next) => {
  try {
    const content = normalizeContent(req.body);
    await pool.execute(
      `INSERT INTO site_content (content_key, content_json)
       VALUES ('portfolio', ?)
       ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)`,
      [JSON.stringify(content)]
    );
    return res.json(content);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const [[admin]] = await pool.execute(
      "SELECT id, username, password_hash FROM admins WHERE username = ?",
      [username]
    );
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    return res.json({ token });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

app.get("/api/projects", async (_req, res, next) => {
  try {
    res.json(await getProjects(true));
  } catch (error) {
    next(error);
  }
});

app.post("/api/uploads/project-image", requireAdmin, imageUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
  return res.json({ path: fileUrl(req.file.filename) });
});

app.post("/api/projects", requireAdmin, async (req, res, next) => {
  try {
    const id = await saveProject(req.body, null);
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid project ID." });
    await saveProject(req.body, id);
    res.json({ id });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid project ID." });
    const [result] = await pool.execute("DELETE FROM projects WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Project not found." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/cv/status", async (_req, res, next) => {
  try {
    const [[row]] = await pool.execute("SELECT file_key FROM site_files WHERE file_key = 'cv'");
    res.json({ available: Boolean(row) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/cv", async (_req, res, next) => {
  try {
    const [[row]] = await pool.execute("SELECT file_path FROM site_files WHERE file_key = 'cv'");
    const fileName = row && storedFileName(fileUrl(row.file_path));
    if (!fileName || !fs.existsSync(path.join(uploadDir, fileName))) {
      return res.status(404).json({ error: "CV is not available yet." });
    }
    return res.download(path.join(uploadDir, fileName), "Nouh-CV.pdf");
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/cv", requireAdmin, cvUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a PDF file." });
    const [[oldFile]] = await pool.execute("SELECT file_path FROM site_files WHERE file_key = 'cv'");
    await pool.execute(
      `INSERT INTO site_files (file_key, original_name, file_path)
       VALUES ('cv', ?, ?)
       ON DUPLICATE KEY UPDATE original_name = VALUES(original_name), file_path = VALUES(file_path)`,
      [req.file.originalname, req.file.filename]
    );
    if (oldFile) removeUploadedFile(fileUrl(oldFile.file_path));
    res.status(201).json({ available: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/cv", requireAdmin, async (_req, res, next) => {
  try {
    const [[oldFile]] = await pool.execute("SELECT file_path FROM site_files WHERE file_key = 'cv'");
    await pool.execute("DELETE FROM site_files WHERE file_key = 'cv'");
    if (oldFile) removeUploadedFile(fileUrl(oldFile.file_path));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/certificates", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, organization, issued_date, description, file_path FROM certificates ORDER BY issued_date DESC, id DESC"
    );
    res.json(rows.map((row) => ({
      ...row,
      date: row.issued_date,
      url: fileUrl(row.file_path),
      type: path.extname(row.file_path).toLowerCase() === ".pdf" ? "application/pdf" : `image/${path.extname(row.file_path).slice(1)}`,
    })));
  } catch (error) {
    next(error);
  }
});

app.post("/api/certificates", requireAdmin, documentUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a certificate file." });
    const title = String(req.body.title || "").trim();
    if (!title) {
      removeUploadedFile(fileUrl(req.file.filename));
      return res.status(400).json({ error: "Certificate title is required." });
    }
    const issuedDate = req.body.date || null;
    const [result] = await pool.execute(
      `INSERT INTO certificates (title, organization, issued_date, description, file_path)
       VALUES (?, ?, ?, ?, ?)`,
      [title, req.body.organization || "", issuedDate, req.body.description || "", req.file.filename]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/certificates/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid certificate ID." });
    const [[certificate]] = await pool.execute("SELECT file_path FROM certificates WHERE id = ?", [id]);
    if (!certificate) return res.status(404).json({ error: "Certificate not found." });
    await pool.execute("DELETE FROM certificates WHERE id = ?", [id]);
    removeUploadedFile(fileUrl(certificate.file_path));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

const buildDir = path.join(__dirname, "..", "build");
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get("*", (_req, res) => res.sendFile(path.join(buildDir, "index.html")));
}

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "File is too large." : error.message;
    return res.status(400).json({ error: message });
  }
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error("API error:", error);
  return res.status(500).json({ error: "The server could not complete the request." });
});

initializeContentStorage()
  .then(() => {
    app.listen(port, () => {
      console.log(`Portfolio API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Could not initialize portfolio content storage:", error.message);
    process.exitCode = 1;
  });

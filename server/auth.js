const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) return res.status(401).json({ error: "Admin login required." });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Your admin session has expired. Please log in again." });
  }
}

module.exports = { requireAdmin };

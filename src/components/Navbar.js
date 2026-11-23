import { useState } from "react";
import { apiRequest } from "../utils/api";
import { notify } from "../utils/notifications";

const links = ["home", "about", "skills", "services", "projects", "certificates", "contact"];

function Navbar({ t, active, theme, setTheme, lang, setLang, isAdmin, setIsAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  function handleAdmin() {
    if (isAdmin) {
      sessionStorage.removeItem("adminToken");
      setIsAdmin(false);
      notify.info(t.adminModeClosed);
      return;
    }
    setUsername("");
    setPassword("");
    setLoginOpen(true);
  }

  async function submitLogin(e) {
    e.preventDefault();
    try {
      const { token } = await apiRequest("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      sessionStorage.setItem("adminToken", token);
      setIsAdmin(true);
      setLoginOpen(false);
      setUsername("");
      setPassword("");
      notify.success(t.adminLoginSuccess);
    } catch (loginError) {
      notify.error(loginError.message);
    }
  }

  return (
    <header className="navbar">
      <a href="#home" className="logo" aria-label={`${t.home} - Nouh`}>
        <img src="/nouh-logo.svg" alt="Nouh developer logo" />
      </a>

      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        {links.map((id) => (
          <a key={id} href={"#" + id} className={active === id ? "active" : ""} onClick={() => setMenuOpen(false)}>
            {t[id]}
          </a>
        ))}
      </nav>

      <div className="nav-tools">
        <button className="admin-btn" onClick={handleAdmin} aria-label={isAdmin ? t.exitAdmin : t.adminLogin}>
          {isAdmin ? t.exitAdmin : t.admin}
        </button>
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t.language}>
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">AR</option>
        </select>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={t.toggleTheme}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label={t.menu}>☰</button>
      </div>

      {loginOpen && (
        <div className="modal admin-modal" onMouseDown={(e) => e.target === e.currentTarget && setLoginOpen(false)}>
          <form className="modal-box admin-login" onSubmit={submitLogin}>
            <button type="button" className="close" onClick={() => setLoginOpen(false)} aria-label={t.close}>×</button>
            <h3>{t.adminLogin}</h3>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.username}
              autoComplete="username"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              autoComplete="current-password"
              required
            />
            <button className="btn gold-btn" type="submit">{t.login}</button>
          </form>
        </div>
      )}
    </header>
  );
}
export default Navbar;

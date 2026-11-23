import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import translations from "./data/translations";
import defaultContent from "./data/portfolioContent.json";
import Navbar from "./components/Navbar";
import IntroLoader from "./components/IntroLoader";
import PortfolioChat from "./components/PortfolioChat";
import SocialLinks from "./components/SocialLinks";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Services from "./sections/Services";
import Projects from "./sections/Projects";
import Certificates from "./sections/Certificates";
import Contact from "./sections/Contact";
import { apiRequest } from "./utils/api";
import { notify } from "./utils/notifications";

const sectionIds = ["home", "about", "skills", "services", "projects", "certificates", "contact"];

function App() {
  // Theme and language are saved in localStorage
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [active, setActive] = useState("home");
  const [progress, setProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [content, setContent] = useState(defaultContent);
  const t = translations[lang];
  const skillLinks = {
    HTML: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    CSS: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    JavaScript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    React: "https://react.dev/learn",
    PHP: "https://www.php.net/",
    Laravel: "https://laravel.com/docs",
    "Node.js": "https://nodejs.org/",
    MySQL: "https://dev.mysql.com/doc/",
    SQL: "https://www.w3schools.com/sql/",
    Git: "https://git-scm.com/doc",
    GitHub: "https://github.com/",
    "VS Code": "https://code.visualstudio.com/docs",
    XAMPP: "https://www.apachefriends.org/",
  };
  const footerLinks = [
    { label: t.digitalDevelopment, href: "#services" },
    { label: t.informationTechnology, href: "#skills" },
    { label: t.artificialIntelligence, href: "https://ai.google.dev/gemini-api/docs", external: true },
    { label: t.programmingLanguages, href: "#skills" },
    ...Object.values(content.skills || {}).flat().map((skill) => ({
      label: skill,
      href: skillLinks[skill] || "#skills",
      external: Boolean(skillLinks[skill]),
    })),
  ].filter((link, index, links) => links.findIndex((item) => item.label === link.label) === index);

  useEffect(() => {
    apiRequest("/content")
      .then(setContent)
      .catch((error) => {
        notify.error(`Could not load portfolio content: ${error.message}`);
        console.error("Could not load portfolio content:", error);
      });
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("adminToken")) return;
    apiRequest("/auth/me")
      .then(() => setIsAdmin(true))
      .catch((error) => {
        sessionStorage.removeItem("adminToken");
        notify.error("Your admin session has expired. Please log in again.");
        console.error("Could not verify the admin session:", error);
      });
  }, []);

  async function updateContent(changes) {
    const updated = await apiRequest("/content", {
      method: "PUT",
      body: { ...content, ...changes },
    });
    setContent(updated);
    return updated;
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; // Arabic = right-to-left
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Scroll progress bar + active section
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 150) setActive(id);
      });
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <IntroLoader t={t} />
      <div className="progress" style={{ width: progress + "%" }} />
      <ToastContainer position="bottom-right" autoClose={3500} newestOnTop closeOnClick pauseOnFocusLoss draggable theme={theme} />
      <Navbar t={t} active={active} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <Hero t={t} isAdmin={isAdmin} contact={content.contact} />
      <About t={t} isAdmin={isAdmin} content={content.personalInfo} onSaveContent={(personalInfo) => updateContent({ personalInfo })} />
      <Skills t={t} isAdmin={isAdmin} skills={content.skills} onSaveSkills={(skills) => updateContent({ skills })} />
      <Services t={t} isAdmin={isAdmin} services={content.services} onSaveServices={(services) => updateContent({ services })} />
      <Projects t={t} isAdmin={isAdmin} />
      <Certificates t={t} isAdmin={isAdmin} />
      <Contact
        t={t}
        isAdmin={isAdmin}
        contact={content.contact}
        onSaveContact={(contact) => updateContent({ contact })}
      />
      <footer className="footer">
        <SocialLinks contact={content.contact} />
        <nav className="footer-tags" aria-label={t.technologyNavigation}>
          {footerLinks.map((link) => (
            <a
              className="footer-tag"
              href={link.href}
              key={link.label}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} Nouh. All rights reserved.</p>
      </footer>
      <PortfolioChat t={t} />
      {progress > 10 && <a href="#home" className="to-top" aria-label={t.backToTop}>↑</a>}
    </>
  );
}
export default App;

import { useState, useEffect } from "react";
import SocialLinks from "../components/SocialLinks";
import { apiRequest, uploadFile } from "../utils/api";
import { notify } from "../utils/notifications";

function Hero({ t, isAdmin, contact }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); // mouse position from -0.5 to 0.5
  const [hasCv, setHasCv] = useState(false);

  useEffect(() => {
    apiRequest("/cv/status")
      .then((result) => setHasCv(result.available))
      .catch((error) => notify.error(`Could not check CV: ${error.message}`));
  }, []);

  function handleMouseMove(e) {
    if (window.innerWidth < 768) return; // no movement on mobile
    setTilt({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
  }

  async function uploadCv(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      notify.error(t.choosePdf);
      e.target.value = "";
      return;
    }
    try {
      await uploadFile("/admin/cv", file);
      setHasCv(true);
      e.target.value = "";
      notify.success(t.cvUploaded);
    } catch (error) {
      notify.error(error.message);
    }
  }

  async function removeCv() {
    try {
      await apiRequest("/admin/cv", { method: "DELETE" });
      setHasCv(false);
      notify.success(t.cvDeleted);
    } catch (error) {
      notify.error(error.message);
    }
  }

  // 3D effect: perspective + rotate + small translate
  const photoStyle = {
    transform: `perspective(1000px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 6}deg) translate(${tilt.x * 20}px, ${tilt.y * 10}px)`,
  };

  return (
    <section id="home" className="hero" onMouseMove={handleMouseMove}>
      <div className="hero-glow" />
      <div className="hero-photo">
        <img src="/nouh.jpeg" alt="Nouh standing in a black suit" style={photoStyle} />
      </div>

      <div className="hero-text">
        <h1>{t.hi}</h1>
        <h2>{t.line1}</h2>
        <h2 className="gold">{t.line2}</h2>
        <p className="tagline">"{t.tagline}"</p>
        <div className="buttons">
          <a href="#projects" className="btn gold-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7V5z" /></svg>
            {t.btnProjects}
          </a>
          <a href="#contact" className="btn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4V4zm2 2v.7l6 4.5 6-4.5V6H6zm12 12V9l-6 4.5L6 9v9h12z" /></svg>
            {t.btnContact}
          </a>
          {hasCv ? (
            <a className="btn" href="/api/cv">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10l3.5-3.5 1.4 1.4L12 18.3l-5.9-7.4 1.4-1.4L11 13V3zm-6 16h14v2H5v-2z" /></svg>
              {t.btnCv}
            </a>
          ) : (
            <button className="btn" onClick={() => notify.info(t.cvUnavailable)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10l3.5-3.5 1.4 1.4L12 18.3l-5.9-7.4 1.4-1.4L11 13V3zm-6 16h14v2H5v-2z" /></svg>
              {t.btnCv}
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="cv-tools">
            <label className="small-link">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 16V6l-3.5 3.5-1.4-1.4L12 2.7l5.9 5.4-1.4 1.4L13 6v10h-2zm-6 3h14v2H5v-2z" /></svg>
              {t.uploadCv}
              <input type="file" accept="application/pdf" onChange={uploadCv} hidden />
            </label>
            {hasCv && (
              <button className="small-link" onClick={removeCv}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10l-1 13H8L7 7zm3-4h4l1 2h4v2H5V5h4l1-2z" /></svg>
                {t.deleteCv}
              </button>
            )}
          </div>
        )}
        <SocialLinks contact={contact} />
      </div>
    </section>
  );
}
export default Hero;

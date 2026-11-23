import { useEffect, useState } from "react";

function IntroLoader({ t }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setVisible(false), reducedMotion ? 400 : 2300);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="intro-loader" role="status" aria-label={t.loadingPortfolio}>
      <div className="intro-logo">
        <span className="intro-ring" />
        <img src="/nouh-logo.svg" alt="" />
      </div>
      <span className="intro-caption">NOUH</span>
    </div>
  );
}

export default IntroLoader;

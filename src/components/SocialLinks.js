function SocialIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };

  if (name === "Instagram") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (name === "WhatsApp") {
    return (
      <svg {...common}>
        <path d="M20.5 11.7a8.5 8.5 0 01-12.6 7.4L3 20.5l1.4-4.7A8.5 8.5 0 1120.5 11.7zm-5.2 3.9c-2.7-1.2-4.6-3-5.5-5.1-.2-.5.1-.9.5-1.2l.5-.4c.3-.2.5-.2.7.2l.8 1.8c.1.3.1.5-.1.7l-.5.6c.6 1.2 1.5 2 2.7 2.6l.6-.6c.2-.2.4-.3.7-.1l1.7.9c.3.2.4.4.2.7l-.3.5c-.3.4-.7.6-1.2.5-.3-.1-.5-.1-.8-.1z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "GitHub") {
    return (
      <svg {...common}>
        <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0112 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0012 2z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "LinkedIn") {
    return (
      <svg {...common}>
        <path d="M5.37 3.8a2.37 2.37 0 110 4.74 2.37 2.37 0 010-4.74zM3.34 9.73h4.06V20H3.34V9.73zm6.42 0h3.9v1.41h.06c.54-1.03 1.87-2.12 3.84-2.12 4.1 0 4.86 2.7 4.86 6.21V20h-4.06v-4.22c0-1.01-.02-2.31-1.41-2.31-1.41 0-1.63 1.1-1.63 2.24V20H13.2V9.73h-3.44z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 5h18v14H3V5zm2 2v1l7 5 7-5V7H5zm14 10V9.7l-7 5-7-5V17h14z" fill="currentColor" />
    </svg>
  );
}

// Shows all social icons. target="_blank" + rel keeps links safe.
function SocialLinks({ contact = {} }) {
  const socialLinks = [
    { name: "Instagram", url: contact.instagram },
    { name: "WhatsApp", url: contact.whatsapp },
    { name: "GitHub", url: contact.github },
    { name: "LinkedIn", url: contact.linkedin },
    { name: "Email", url: contact.email ? `mailto:${contact.email}` : "" },
  ].filter((link) => link.url);

  return (
    <div className="social-links">
      {socialLinks.map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.name} title={link.name}>
          <SocialIcon name={link.name} />
        </a>
      ))}
    </div>
  );
}
export default SocialLinks;

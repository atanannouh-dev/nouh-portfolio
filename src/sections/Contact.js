import { useState } from "react";
import SocialLinks from "../components/SocialLinks";
import { apiRequest } from "../utils/api";
import { notify } from "../utils/notifications";

function Contact({ t, isAdmin, contact, onSaveContact }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(""); // feedback: "ok|text" or "err|text"
  const [sending, setSending] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({});

  function startEditingContact() {
    setContactDraft({ ...contact });
    setEditingContact(true);
  }

  async function saveContact(e) {
    e.preventDefault();
    try {
      await onSaveContact(contactDraft);
      setEditingContact(false);
      notify.success(t.contactUpdated);
    } catch (error) {
      notify.error(error.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    const submission = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );
    if (!submission.name || !submission.email || !submission.subject || !submission.message) {
      return setStatus(`err|${t.fillAllFields}`);
    }
    if (!/^\S+@\S+\.\S+$/.test(submission.email)) return setStatus(`err|${t.validEmail}`);

    setSending(true);
    setStatus("");
    try {
      await apiRequest("/contact", {
        method: "POST",
        body: submission,
      });
      setForm({ name: "", email: "", subject: "", message: "" });
      setStatus(`ok|${t.messageSent}`);
    } catch (error) {
      setStatus(`err|${error.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="section alt">
      <h2 className="title">{t.contact}</h2>
      {(contact.phone || contact.email) && (
        <div className="contact-details">
          {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
        </div>
      )}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <input placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} disabled={sending} />
        <input type="email" placeholder={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} disabled={sending} />
        <input placeholder={t.subject} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={200} disabled={sending} />
        <textarea placeholder={t.message} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={5000} disabled={sending} />
        <button className="btn gold-btn" type="submit" disabled={sending}>{sending ? t.sending : t.sendMessage}</button>
        {status && <p className={status.startsWith("ok") ? "ok" : "err"}>{status.split("|")[1]}</p>}
      </form>
      {isAdmin && !editingContact && (
        <div className="contact-admin">
          <button className="btn" type="button" onClick={startEditingContact}>{t.editContact}</button>
        </div>
      )}
      {isAdmin && editingContact && (
        <form className="card form" onSubmit={saveContact}>
          <h3>{t.publicContact}</h3>
          <label htmlFor="contact-phone">{t.phoneNumber}</label>
          <input id="contact-phone" type="tel" value={contactDraft.phone || ""} onChange={(e) => setContactDraft({ ...contactDraft, phone: e.target.value })} maxLength={40} />
          <label htmlFor="contact-email">{t.email}</label>
          <input id="contact-email" type="email" value={contactDraft.email || ""} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} maxLength={254} />
          <label htmlFor="contact-whatsapp">{t.whatsappLink}</label>
          <input id="contact-whatsapp" type="url" value={contactDraft.whatsapp || ""} onChange={(e) => setContactDraft({ ...contactDraft, whatsapp: e.target.value })} maxLength={500} />
          <label htmlFor="contact-github">{t.githubUrl}</label>
          <input id="contact-github" type="url" value={contactDraft.github || ""} onChange={(e) => setContactDraft({ ...contactDraft, github: e.target.value })} maxLength={500} />
          <label htmlFor="contact-linkedin">{t.linkedinUrl}</label>
          <input id="contact-linkedin" type="url" value={contactDraft.linkedin || ""} onChange={(e) => setContactDraft({ ...contactDraft, linkedin: e.target.value })} maxLength={500} />
          <label htmlFor="contact-instagram">{t.instagramUrl}</label>
          <input id="contact-instagram" type="url" value={contactDraft.instagram || ""} onChange={(e) => setContactDraft({ ...contactDraft, instagram: e.target.value })} maxLength={500} />
          <div className="buttons">
            <button className="btn gold-btn" type="submit">{t.save}</button>
            <button className="btn" type="button" onClick={() => setEditingContact(false)}>{t.cancel}</button>
          </div>
        </form>
      )}
      <SocialLinks contact={contact} />
    </section>
  );
}
export default Contact;

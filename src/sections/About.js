import personalInfo from "../data/personalInfo";
import { useState } from "react";
import { notify } from "../utils/notifications";

function About({ t, isAdmin, content, onSaveContent }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(personalInfo);
  const localizedValue = (value) => ({
    "Digital Development": t.digitalDevelopment,
    Student: t.student,
    "Casablanca, Morocco": t.casablancaMorocco,
  }[value] || value);
  const aboutText = content.about === personalInfo.about ? t.aboutDescription : content.about;

  function startEditing() {
    setDraft(content);
    setEditing(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await onSaveContent(draft);
      setEditing(false);
      notify.success(t.profileUpdated);
    } catch (saveError) {
      notify.error(saveError.message);
    }
  }

  return (
    <section id="about" className="section">
      <h2 className="title">{t.about}</h2>
      <p className="about-text">{aboutText}</p>
      <div className="cards">
        <div className="card"><small>{t.name}</small><h3>{content.name}</h3></div>
        <div className="card"><small>{t.field}</small><h3>{localizedValue(content.field)}</h3></div>
        <div className="card"><small>{t.role}</small><h3>{localizedValue(content.role)}</h3></div>
        <div className="card"><small>{t.location}</small><h3>{localizedValue(content.location)}</h3></div>
      </div>
      {isAdmin && !editing && <button className="btn" onClick={startEditing}>{t.editProfile}</button>}
      {isAdmin && editing && (
        <form className="card form" onSubmit={handleSubmit}>
          <h3>{t.editProfile}</h3>
          <input placeholder={t.name} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <input placeholder={t.field} value={draft.field} onChange={(e) => setDraft({ ...draft, field: e.target.value })} required />
          <input placeholder={t.role} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} required />
          <input placeholder={t.location} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} required />
          <textarea placeholder={t.aboutLabel} value={draft.about} onChange={(e) => setDraft({ ...draft, about: e.target.value })} required />
          <div className="buttons">
            <button className="btn gold-btn" type="submit">{t.saveProfile}</button>
            <button className="btn" type="button" onClick={() => setEditing(false)}>{t.cancel}</button>
          </div>
        </form>
      )}
    </section>
  );
}
export default About;

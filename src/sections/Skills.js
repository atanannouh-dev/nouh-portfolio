import { useState } from "react";
import { notify } from "../utils/notifications";

function Skills({ t, isAdmin, skills, onSaveSkills }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const categoryLabels = { Frontend: t.frontend, Backend: t.backend, Database: t.database, Tools: t.tools };

  function startEditing() {
    setDraft(Object.entries(skills).map(([category, items]) => ({ category, items: items.join(", ") })));
    setEditing(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = {};
    for (const row of draft) {
      const category = row.category.trim();
      if (!category || Object.prototype.hasOwnProperty.call(updated, category)) {
        notify.error(t.uniqueSkillGroups);
        return;
      }
      updated[category] = row.items.split(",").map((item) => item.trim()).filter(Boolean);
    }
    try {
      await onSaveSkills(updated);
      setEditing(false);
      notify.success(t.skillsUpdated);
    } catch (saveError) {
      notify.error(saveError.message);
    }
  }

  return (
    <section id="skills" className="section alt">
      <h2 className="title">{t.skills}</h2>
      <div className="cards">
        {Object.keys(skills).map((category) => (
          <div className="card" key={category}>
            <h3 className="gold">{categoryLabels[category] || category}</h3>
            <div className="tags">
              {skills[category].map((skill) => <span key={skill} className="tag">{skill}</span>)}
            </div>
          </div>
        ))}
      </div>
      {isAdmin && !editing && <button className="btn" onClick={startEditing}>{t.editSkills}</button>}
      {isAdmin && editing && (
        <form className="card form" onSubmit={handleSubmit}>
          <h3>{t.editSkills}</h3>
          {draft.map((row, index) => (
            <div className="skill-editor-row" key={index}>
              <input
                placeholder={t.skillGroup}
                value={row.category}
                onChange={(e) => setDraft(draft.map((item, i) => i === index ? { ...item, category: e.target.value } : item))}
                required
              />
              <input
                placeholder={t.skillsComma}
                value={row.items}
                onChange={(e) => setDraft(draft.map((item, i) => i === index ? { ...item, items: e.target.value } : item))}
              />
              <button className="btn small danger" type="button" onClick={() => setDraft(draft.filter((_, i) => i !== index))}>{t.removeGroup}</button>
            </div>
          ))}
          <button className="btn small" type="button" onClick={() => setDraft([...draft, { category: "", items: "" }])}>{t.addGroup}</button>
          <div className="buttons">
            <button className="btn gold-btn" type="submit">{t.saveSkills}</button>
            <button className="btn" type="button" onClick={() => setEditing(false)}>{t.cancel}</button>
          </div>
        </form>
      )}
    </section>
  );
}
export default Skills;

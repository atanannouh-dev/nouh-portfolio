import { useState } from "react";
import defaultContent from "../data/portfolioContent.json";
import { notify } from "../utils/notifications";

function Services({ t, isAdmin, services, onSaveServices }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(defaultContent.services);
  const serviceLabels = {
    "Website Development": t.websiteDevelopment,
    "Frontend Development": t.frontendDevelopment,
    "Backend Development": t.backendDevelopment,
    "Responsive Web Design": t.responsiveWebDesign,
    "Database Design": t.databaseDesign,
    "Web Application Development": t.webApplicationDevelopment,
  };

  function startEditing() {
    setDraft([...services]);
    setEditing(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = draft.map((service) => service.trim()).filter(Boolean);
    try {
      await onSaveServices(updated);
      setEditing(false);
      notify.success(t.servicesUpdated);
    } catch (saveError) {
      notify.error(saveError.message);
    }
  }

  return (
    <section id="services" className="section">
      <h2 className="title">{t.services}</h2>
      <div className="cards">
        {services.map((name, index) => <div className="card" key={`${name}-${index}`}><h3>{serviceLabels[name] || name}</h3></div>)}
      </div>
      {isAdmin && !editing && <button className="btn" onClick={startEditing}>{t.editServices}</button>}
      {isAdmin && editing && (
        <form className="card form" onSubmit={handleSubmit}>
          <h3>{t.editServices}</h3>
          {draft.map((service, index) => (
            <div className="service-editor-row" key={index}>
              <input
                placeholder={t.service}
                value={service}
                onChange={(e) => setDraft(draft.map((item, i) => i === index ? e.target.value : item))}
                required
              />
              <button className="btn small danger" type="button" onClick={() => setDraft(draft.filter((_, i) => i !== index))}>{t.remove}</button>
            </div>
          ))}
          <button className="btn small" type="button" onClick={() => setDraft([...draft, ""])}>{t.addService}</button>
          <div className="buttons">
            <button className="btn gold-btn" type="submit">{t.saveServices}</button>
            <button className="btn" type="button" onClick={() => setEditing(false)}>{t.cancel}</button>
          </div>
        </form>
      )}
    </section>
  );
}
export default Services;

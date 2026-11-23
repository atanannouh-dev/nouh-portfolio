import { useState, useEffect } from "react";
import { apiRequest, uploadFile } from "../utils/api";
import { notify } from "../utils/notifications";

function Certificates({ t, isAdmin }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null); // certificate shown full screen
  const [form, setForm] = useState({ title: "", organization: "", date: "", description: "" });
  const [file, setFile] = useState(null);

  async function loadCerts() {
    try {
      setCerts(await apiRequest("/certificates"));
    } catch (loadError) {
      notify.error(`Could not load certificates: ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadCerts(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      notify.error(t.chooseCertificate);
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!okTypes.includes(file.type)) {
      notify.error(t.unsupportedFile);
      return;
    }
    try {
      await uploadFile("/certificates", file, form);
      setForm({ title: "", organization: "", date: "", description: "" });
      setFile(null);
      e.target.reset();
      await loadCerts();
      notify.success(t.certificateUploaded);
    } catch (uploadError) {
      notify.error(uploadError.message);
    }
  }

  async function remove(id) {
    if (window.confirm(t.deleteCertificateConfirm)) {
      try {
        await apiRequest(`/certificates/${id}`, { method: "DELETE" });
        await loadCerts();
        notify.success(t.certificateDeleted);
      } catch (deleteError) {
        notify.error(deleteError.message);
      }
    }
  }

  const visible = certs.filter((c) => (c.title + c.organization).toLowerCase().includes(search.toLowerCase()));

  // Show a PDF or an image depending on the file type
  function show(c) {
    return c.type === "application/pdf" ? <embed src={c.url} type="application/pdf" /> : <img src={c.url} alt={c.title} />;
  }

  return (
    <section id="certificates" className="section">
      <h2 className="title">{t.certificates}</h2>
      <div className="toolbar">
        <input placeholder={t.searchCertificates} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <p className="empty">{t.loadingCertificates}</p>}
      {!loading && visible.length === 0 && <p className="empty">{t.noCertificates}</p>}

      <div className="cards">
        {visible.map((c) => (
          <div className="card" key={c.id}>
            <div className="thumb" onClick={() => setPreview(c)}>{show(c)}</div>
            <h3>{c.title}</h3>
            <small>{c.organization} {c.date && "• " + c.date}</small>
            <p>{c.description}</p>
            <button className="btn small" onClick={() => setPreview(c)}>{t.preview}</button>{" "}
            {isAdmin && <button className="btn small danger" onClick={() => remove(c.id)}>{t.remove}</button>}
          </div>
        ))}
      </div>

      {isAdmin && (
        <form className="card form" onSubmit={handleSubmit}>
          <h3>{t.uploadCertificate}</h3>
          <input placeholder={t.title} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder={t.organization} value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <textarea placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn gold-btn" type="submit">{t.upload}</button>
          <small>{t.certificatesSaved}</small>
        </form>
      )}

      {preview && (
        <div className="modal" onClick={() => setPreview(null)}>
          <div className="modal-box big" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setPreview(null)} aria-label={t.close}>×</button>
            {show(preview)}
          </div>
        </div>
      )}
    </section>
  );
}
export default Certificates;

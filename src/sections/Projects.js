import { useState, useEffect } from "react";
import { apiRequest, uploadFile } from "../utils/api";
import { notify } from "../utils/notifications";
import defaultProjects from "../data/projects.json";

const emptyForm = { title: "", description: "", technologies: "", github: "", demo: "", screenshot: "" };

function normalizeProject(project) {
  const starterProject = defaultProjects.find((item) => item.title === project.title);
  const hasActionLabels = Array.isArray(project.technologies) &&
    project.technologies.some((technology) => /\b(?:Details|Edit|Delete)\b/i.test(technology));

  return hasActionLabels && starterProject
    ? { ...project, technologies: starterProject.technologies }
    : project;
}

function Projects({ t, isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null); // project shown in the modal
  const [form, setForm] = useState(emptyForm);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [editingId, setEditingId] = useState(null);

  async function loadProjects() {
    try {
      const loadedProjects = await apiRequest("/projects");
      setProjects(loadedProjects.map(normalizeProject));
    } catch (loadError) {
      notify.error(`Could not load projects: ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadProjects(); }, []);

  const allTechs = ["All", ...new Set(projects.flatMap((p) => p.technologies))];

  const visible = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) && (filter === "All" || p.technologies.includes(filter))
  );
  const descriptionFor = (project) => {
    const defaultProject = defaultProjects.find((item) => item.title === project.title);
    return defaultProject && project.description === defaultProject.description
      ? t.colisTrackerDescription
      : project.description;
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notify.error(t.chooseImage);
      e.target.value = "";
      return;
    }
    if (screenshotPreview.startsWith("blob:")) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  function resetForm(formElement) {
    if (screenshotPreview.startsWith("blob:")) URL.revokeObjectURL(screenshotPreview);
    setForm(emptyForm);
    setScreenshotFile(null);
    setScreenshotPreview("");
    setEditingId(null);
    formElement.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const formElement = e.currentTarget;
    try {
      let screenshot = form.screenshot;
      if (screenshotFile) {
        const uploaded = await uploadFile("/uploads/project-image", screenshotFile);
        screenshot = uploaded.path;
      }
      const project = {
        title: form.title,
        description: form.description,
        technologies: form.technologies.split(",").map((value) => value.trim()).filter(Boolean),
        github: form.github,
        demo: form.demo,
        screenshot,
      };
      await apiRequest(editingId ? `/projects/${editingId}` : "/projects", {
        method: editingId ? "PUT" : "POST",
        body: project,
      });
      resetForm(formElement);
      await loadProjects();
      notify.success(editingId ? t.projectUpdated : t.projectAdded);
    } catch (saveError) {
      notify.error(saveError.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ ...p, technologies: p.technologies.join(", ") });
    setScreenshotFile(null);
    setScreenshotPreview(p.screenshot || "");
  }

  async function remove(id) {
    if (!window.confirm(t.deleteProjectConfirm)) return;
    try {
      await apiRequest(`/projects/${id}`, { method: "DELETE" });
      await loadProjects();
      notify.success(t.projectDeleted);
    } catch (deleteError) {
      notify.error(deleteError.message);
    }
  }

  return (
    <section id="projects" className="section alt">
      <h2 className="title">{t.projects}</h2>

      <div className="toolbar">
        <input placeholder={t.searchProjects} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {allTechs.map((tech) => <option key={tech} value={tech}>{tech === "All" ? t.allProjects : tech}</option>)}
        </select>
      </div>

      {loading && <p className="empty">{t.loadingProjects}</p>}
      {!loading && visible.length === 0 && <p className="empty">{t.noProjects}</p>}

      <div className="cards">
        {visible.map((p) => (
          <div className="card project" key={p.id}>
            {p.screenshot ? <img src={p.screenshot} alt={p.title} /> : <div className="no-shot">{t.noScreenshot}</div>}
            <h3>{p.title}</h3>
            <p>{descriptionFor(p)}</p>
            <div className="tags">{p.technologies.map((x) => <span className="tag" key={x}>{x}</span>)}</div>
            <div className="buttons">
              {p.github && <a className="btn small" href={p.github} target="_blank" rel="noopener noreferrer">{t.github}</a>}
              {p.demo && <a className="btn small" href={p.demo} target="_blank" rel="noopener noreferrer">{t.liveDemo}</a>}
              <button className="btn small" onClick={() => setSelected(p)}>{t.details}</button>
              {isAdmin && <button className="btn small" onClick={() => startEdit(p)}>{t.edit}</button>}
              {isAdmin && <button className="btn small danger" onClick={() => remove(p.id)}>{t.remove}</button>}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <form className="card form" onSubmit={handleSubmit}>
          <h3>{editingId ? t.editProject : t.addProject}</h3>
          <input name="title" placeholder={t.title} value={form.title} onChange={handleChange} required />
          <textarea name="description" placeholder={t.description} value={form.description} onChange={handleChange} />
          <input name="technologies" placeholder={t.technologiesComma} value={form.technologies} onChange={handleChange} />
          <input name="github" placeholder={t.githubLink} value={form.github} onChange={handleChange} />
          <input name="demo" placeholder={t.demoLink} value={form.demo} onChange={handleChange} />
          <label>
            {t.projectScreenshot}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleScreenshot} />
          </label>
          {screenshotPreview && (
            <img className="screenshot-preview" src={screenshotPreview} alt="Project screenshot preview" />
          )}
          <button className="btn gold-btn" type="submit">{editingId ? t.saveChanges : t.addProjectButton}</button>
        </form>
      )}

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)} aria-label={t.close}>×</button>
            {selected.screenshot && <img src={selected.screenshot} alt={selected.title} />}
            <h3>{selected.title}</h3>
            <p>{descriptionFor(selected)}</p>
            <div className="tags">{selected.technologies.map((x) => <span className="tag" key={x}>{x}</span>)}</div>
          </div>
        </div>
      )}
    </section>
  );
}
export default Projects;

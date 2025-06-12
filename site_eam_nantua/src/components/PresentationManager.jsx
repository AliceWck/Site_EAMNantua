import { useEffect, useState } from "react";
import './PresentationManager.css';

export default function PresentationManager() {
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/presentation-content")
      .then((res) => res.json())
      .then(setFormData);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleCourseChange(index, value) {
    const updatedCourses = [...formData.courses];
    updatedCourses[index] = value;
    setFormData((prev) => ({ ...prev, courses: updatedCourses }));
  }

  function addCourse() {
    setFormData((prev) => ({ ...prev, courses: [...prev.courses, ""] }));
  }

  function removeCourse(index) {
    const updatedCourses = formData.courses.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, courses: updatedCourses }));
  }

  function handleSave() {
    fetch("http://localhost:5000/api/presentation-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur sauvegarde");
        setMessage("✅ Présentation mise à jour !");
      })
      .catch(() => setMessage("❌ Erreur lors de la sauvegarde."));
  }

  function handlePdfChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formDataFile = new FormData();
    formDataFile.append("pdf", file);

    if (formData.pdfUrl) {
      formDataFile.append("oldPdfUrl", formData.pdfUrl); // important
    }

    fetch("http://localhost:5000/api/upload-pdf", {
      method: "POST",
      body: formDataFile,
    })
      .then(res => res.json())
      .then(data => {
        if (data.pdfUrl) {
          // 1. on met à jour le state local
          setFormData(prev => {
            const updated = { ...prev, pdfUrl: data.pdfUrl };

            // 2. on sauvegarde aussi côté serveur dans le JSON
            fetch("http://localhost:5000/api/presentation-content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            }).then(() => {
              setMessage("✅ PDF uploadé avec succès !");
            });

            return updated;
          });
        } else {
          setMessage("❌ Erreur lors de l’upload du PDF");
        }
      })
  }



  if (!formData) return <p>Chargement...</p>;

  return (
    <div className="presentation-admin">
      <h2>🎨 Modifier la Présentation</h2>

      <label>
        Titre :
        <input name="title" value={formData.title} onChange={handleChange} />
      </label>

      <label>
        Sous-titre :
        <input name="subtitle" value={formData.subtitle} onChange={handleChange} />
      </label>

      <label>
        Mission :
        <textarea name="mission" value={formData.mission} onChange={handleChange} />
      </label>

      <label>
        Adresse :
        <input name="address" value={formData.address} onChange={handleChange} />
      </label>

      <label>
        Cours proposés :
        <div className="course-list">
          {formData.courses.map((course, index) => (
            <div key={index}>
              <input
                type="text"
                value={course}
                onChange={(e) => handleCourseChange(index, e.target.value)}
              />
              <button type="button" onClick={() => removeCourse(index)}>🗑️ Supprimer</button>
            </div>
          ))}
        </div>
        <div className="course-actions">
          <button type="button" onClick={addCourse}>➕ Ajouter un cours</button>
        </div>
        <label>
          PDF des cours :
          <input type="file" accept="application/pdf" onChange={handlePdfChange} />
        </label>

        </label> 
        
        {formData.pdfUrl && (
          <p>
            PDF actuel :{" "}
            <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer">
              Voir le PDF
            </a>
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            if (!formData.pdfUrl) return;

            fetch("http://localhost:5000/api/delete-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pdfUrl: formData.pdfUrl }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setFormData(prev => ({ ...prev, pdfUrl: "" }));
                  setMessage("✅ PDF supprimé avec succès !");
                } else {
                  setMessage("❌ Erreur lors de la suppression du PDF.");
                }
              })
              .catch(() => setMessage("❌ Erreur lors de la suppression du PDF."));
          }}
        >
          🗑️ Supprimer le PDF actuel
        </button>


      <div className="form-actions">
        <button onClick={handleSave}>💾 Enregistrer</button>
      </div>

      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}

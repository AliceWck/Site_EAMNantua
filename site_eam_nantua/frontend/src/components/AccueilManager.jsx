import React, { useState, useEffect } from "react";
import "./AccueilManager.css";

export default function AccueilManager() {
  const API = import.meta.env.VITE_API_URL;
  
  const [facts, setFacts] = useState([]);
  const [editingFact, setEditingFact] = useState(null);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [icon, setIcon] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageVersion, setImageVersion] = useState(Date.now());

  useEffect(() => {
    fetch(`${API}/api/facts`)
      .then((res) => res.json())
      .then((data) => setFacts(data))
      .catch((err) => console.error("Erreur chargement facts:", err));
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmitImage = async () => {
    if (!imageFile) return alert("Veuillez choisir une image.");

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const res = await fetch(`${API}/api/upload-home-image`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Image d'accueil mise à jour !");
        // Met à jour la version pour forcer le reload sur le site utilisateur
        setImageVersion(Date.now());
        // Optionnel : tu peux aussi mettre à jour une info côté serveur/fichier JSON si besoin
      } else {
        alert("Erreur lors de l'upload de l'image.");
      }
    } catch (err) {
      alert("Erreur réseau lors de l'upload.");
      console.error(err);
    }
  };

  const handleAddFact = async () => {
    if (!title.trim() || !value.trim()) {
      return alert("Le titre et la valeur sont obligatoires.");
    }

    try {
      const res = await fetch(`${API}/api/facts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          value: value.trim(),
          icon: icon.trim() || null,
        }),
      });
      if (res.ok) {
        const newFact = await res.json();
        setFacts([...facts, newFact]);
        resetForm();
      } else {
        const errData = await res.json();
        alert("Erreur ajout fact: " + errData.message);
      }
    } catch (err) {
      alert("Erreur réseau lors de l'ajout du fact.");
      console.error(err);
    }
  };

  const startEditFact = (fact) => {
    setEditingFact(fact);
    setTitle(fact.title);
    setValue(fact.value);
    setIcon(fact.icon || "");
  };

  const cancelEdit = () => {
    resetForm();
    setEditingFact(null);
  };

  const handleEditFact = async () => {
    if (!editingFact) return;
    if (!title.trim() || !value.trim()) {
      return alert("Le titre et la valeur sont obligatoires.");
    }

    try {
      const res = await fetch(`${API}/api/facts/${editingFact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          value: value.trim(),
          icon: icon.trim() || null,
        }),
      });
      if (res.ok) {
        const updatedFact = await res.json();
        setFacts(facts.map(f => (f.id === updatedFact.id ? updatedFact : f)));
        resetForm();
        setEditingFact(null);
      } else {
        const errData = await res.json();
        alert("Erreur modification fact: " + errData.message);
      }
    } catch (err) {
      alert("Erreur réseau lors de la modification.");
      console.error(err);
    }
  };

  const handleDeleteFact = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fact ?")) return;
    try {
      const res = await fetch(`${API}/api/facts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFacts(facts.filter(f => f.id !== id));
      } else {
        const errData = await res.json();
        alert("Erreur suppression fact: " + errData.message);
      }
    } catch (err) {
      alert("Erreur réseau lors de la suppression.");
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setValue("");
    setIcon("");
  };

  return (
    <div className="accueil-manager">
      <h2>🏠 Gestion de la page d’accueil</h2>

      {/* Image d’accueil */}
      <section className="image-upload">
        <h3>🖼️ Image d’accueil</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="file-input"
        />
        {preview && (
          <div className="image-preview">
            <p>Prévisualisation :</p>
            <img src={preview} alt="Prévisualisation" />
          </div>
        )}
        <button onClick={handleSubmitImage} className="btn-primary" style={{ marginTop: "0.5rem" }}>
          💾 Mettre à jour l’image
        </button>
      </section>

      {/* Facts */}
      <section className="facts-management">
        <h3>💬 Gestion des facts</h3>

        <ul>
          {facts.map((fact) => (
            <li key={fact.id}>
              <div className="fact-main">
                <div className="fact-icon">{fact.icon || "💡"}</div>
                <div className="fact-text">
                  <strong>{fact.title}</strong> {fact.value}
                </div>
              </div>
              <div className="fact-actions">
                <button className="edit-btn" onClick={() => startEditFact(fact)}>
                  ✏️ Modifier
                </button>
                <button className="delete-btn" onClick={() => handleDeleteFact(fact.id)}>
                  🗑️ Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form className="facts-form" onSubmit={e => e.preventDefault()}>
          <h4>{editingFact ? "Modifier un fact" : "Ajouter un nouveau fact"}</h4>

          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="fact-input"
          />
          <textarea
            placeholder="Valeur"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="fact-input"
          />
          {/* <input
            type="text"
            placeholder="Valeur"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="fact-input"
          /> */}
          <input
            type="text"
            placeholder="Icône (optionnel)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="fact-input"
          />

          <div className="facts-form-buttons">
            {editingFact ? (
              <>
                <button type="button" className="btn-primary" onClick={handleEditFact}>
                  💾 Enregistrer
                </button>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  ❌ Annuler
                </button>
              </>
            ) : (
              <button type="button" className="btn-primary" onClick={handleAddFact}>
                ➕ Ajouter
              </button>
            )}
          </div>
        </form>

      </section>
    </div>
  );
}

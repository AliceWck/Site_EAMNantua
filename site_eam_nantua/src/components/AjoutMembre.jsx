import React, { useState } from "react";
import axios from "axios";

export default function AjoutMembre() {
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [photo, setPhoto] = useState(""); // chemin ou URL
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    const response = await axios.post("http://localhost:5000/api/upload-photo", formData);
    setPhoto(response.data.url);
  };

  const handleSubmit = async () => {
    if (!nom || !poste) return alert("Nom et poste requis");

    // Upload si fichier sélectionné
    if (file && !photo) await handleUpload();

    const newMembre = { nom, poste, photo };
    await axios.post("http://localhost:5000/api/equipe", newMembre);
    alert("Membre ajouté !");
  };

  return (
    <div>
      <h3>Ajouter un membre</h3>
      <input type="text" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
      <input type="text" placeholder="Poste" value={poste} onChange={(e) => setPoste(e.target.value)} />

      <div>
        <label>Photo (URL ou fichier)</label>
        <input type="text" placeholder="URL (optionnel)" value={photo} onChange={(e) => setPhoto(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      </div>

      <button onClick={handleSubmit}>Ajouter</button>
    </div>
  );
}

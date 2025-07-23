import { useState, useEffect } from "react";
import './PartenaireManager.css';


export default function PartenaireManager() {
    const [logos, setLogos] = useState([]);
    const [newLogo, setNewLogo] = useState({ url: "", nom: "" });
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        // fetch("http://localhost:5000/api/partenaires")
        fetch(`${import.meta.env.VITE_API_URL}/api/partenaires`)
            .then((res) => res.json())
            .then((data) => setLogos(data))
            .catch((err) => console.error("Erreur chargement partenaires :", err));
    }, []);

    const uploadLogo = async () => {
        if (!logoFile) return null;
        const formData = new FormData();
        formData.append("logo", logoFile);

        // const res = await fetch("http://localhost:5000/api/upload-logo", {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-logo`, {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            return data.url;
        } else {
            alert("❌ Échec de l’upload");
            return null;
        }
    };

    const handleAddLogo = async () => {
        let logoUrl = newLogo.url;
        if (logoFile && !logoUrl) {
            logoUrl = await uploadLogo();
            if (!logoUrl) return;
        }

        if (!newLogo.nom || !logoUrl) {
            alert("⚠️ Veuillez fournir un nom et un logo (URL ou fichier)");
            return;
        }

        // const res = await fetch("http://localhost:5000/api/partenaires", {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/partenaires`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nom: newLogo.nom,
                logo: logoUrl,
            }),
        });

    //     if (res.ok) {
    //         const saved = await res.json();
    //         setLogos([...logos, saved]);
    //         setNewLogo({ nom: "", url: "" });
    //         setLogoFile(null);
    //     } else {
    //         const error = await res.json();
    //         alert(`❌ Erreur: ${error.message}`);
    //     }
    // };

        if (res.ok) {
        const saved = await res.json();
        setLogos((prev) => [...prev, saved]);
        setNewLogo({ nom: "", url: "" });
        setLogoFile(null);
        } else {
        const error = await res.json();
        alert(`❌ Erreur: ${error.message}`);
        }
    };

    const handleDeleteLogo = async (id) => {
        // const res = await fetch(`http://localhost:5000/api/partenaires/${id}`, {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/partenaires/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setLogos(logos.filter((l) => l.id !== id));
        } else {
            alert("❌ Échec de la suppression");
        }
    };

    return (
        <div className="partenaire-manager">
            <div className="partenaire-manager-form">
                <h3>Ajouter un logo de partenaire</h3>

                <input
                    type="text"
                    placeholder="Nom du partenaire"
                    value={newLogo.nom}
                    onChange={(e) => setNewLogo({ ...newLogo, nom: e.target.value })}
                />

                <input
                    type="url"
                    placeholder="URL du logo (ou choisir un fichier)"
                    value={newLogo.url}
                    onChange={(e) => setNewLogo({ ...newLogo, url: e.target.value })}
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                />

                <button onClick={handleAddLogo} className="add-button-violet">Ajouter</button>
            </div>

            <h4>Logos existants</h4>
            <div className="logo-grid">
                {logos.map((logo) => (
                    <div key={logo.id} className="logo-item">
                        {logo.logo && (
                            <img src={logo.logo} alt={logo.nom || "logo partenaire"} />
                        )}
                        <p>{logo.nom}</p>
                        <button onClick={() => handleDeleteLogo(logo.id)}>🗑️</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

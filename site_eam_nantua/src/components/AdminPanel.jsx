import { useState, useEffect } from "react";
import "./AdminPanel.css";
import GalleryManager from './GalleryManager';
import PartenaireManager from './PartenaireManager';
import AccueilManager from './AccueilManager';
import PresentationManager from "./PresentationManager";


export default function AdminPanel({ onLogout }) {
    const [activeTab, setActiveTab] = useState("accueil");
    const [formulaires, setFormulaires] = useState([]);

    const [message, setMessage] = useState("");
    const [contact, setContact] = useState({ phone: "", email: "", facebook: "", instagram: "" });

    const [eventNotes, setEventNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "", date: "" });

    const [newForm, setNewForm] = useState({ name: "", url: "" });

    const [equipe, setEquipe] = useState([]);
    const [nouveauMembre, setNouveauMembre] = useState({ nom: "", poste: "", photo: "", type: "" });
    const [photoFile, setPhotoFile] = useState(null);

    const [saveMessage, setSaveMessage] = useState("");



    useEffect(() => {
        // Récupération des formulaires A FAIRE, ICI EXEMPLE
        // fetch("http://localhost:5000/api/formulaires")
        fetch(`${import.meta.env.VITE_API_URL}/api/formulaires`)
            .then((res) => res.json())
            .then((data) => setFormulaires(data));

        // Récupération des infos de contact
        // fetch("http://localhost:5000/api/contact")
        fetch(`${import.meta.env.VITE_API_URL}/api/contact`)
            .then((res) => res.json())
            .then((data) => setContact(data));

        // fetch("http://localhost:5000/api/notes")
        //     .then((res) => res.json())
        //     .then((data) => {
        //         const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        //         setEventNotes(sorted);
        //     });
        // fetch("http://localhost:5000/api/notes")
        fetch(`${import.meta.env.VITE_API_URL}/api/notes`)
            .then((res) => res.json())
            .then((data) => {
                setEventNotes(data); // ne pas trier ici
        });


        // fetch("http://localhost:5000/api/equipe")
        fetch(`${import.meta.env.VITE_API_URL}/api/equipe`)
            .then((res) => res.json())
            .then((data) => setEquipe(data));

            
    }, []);



    const confirmAction = (message, callback) => {
        if (window.confirm(message)) {
            callback();
        }
    };

    const showSaveMessage = (msg) => {
        setSaveMessage(msg);
        setTimeout(() => setSaveMessage(""), 3000); // disparaît après 3 sec
    };



    //////////// CONTACT

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContact({ ...contact, [name]: value });
    };

    const handleSaveContact = async () => {
    // const res = await fetch("http://localhost:5000/api/contact", {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
    });
    if (res.ok) {
        setMessage("✅ Informations de contact mises à jour !");
    }
    };





    //////////////// FORMULAIRES


    const handleAddForm = (nouveauFormulaire) => {
        // Générer un ID temporaire ou unique
        const idTemp = Date.now().toString();
        const formWithId = { ...nouveauFormulaire, id: idTemp };

        // Met à jour uniquement l'état local (pas d'appel fetch ici)
        setFormulaires((prev) => [...prev, formWithId]);
        setMessage("📝 Formulaire ajouté localement. Cliquez sur 'Enregistrer' pour appliquer.");
        setNewForm({ name: "", url: "" });
    };


    const handleDeleteForm = async (id) => {
        // Si c’est un ID temporaire (type number ou string Date.now())
        const isTemp = typeof id === "string" && /^\d+$/.test(id);

        if (isTemp) {
            // Supprimer localement uniquement
            setFormulaires((prev) => prev.filter((f) => f.id !== id));
            setMessage("🗑️ Formulaire local supprimé.");
            return;
        }

        try {
            // const res = await fetch(`http://localhost:5000/api/formulaires/${id}`, {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/formulaires/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setFormulaires(formulaires.filter((f) => f.id !== id));
                setMessage("❌ Formulaire supprimé !");
            } else {
                setMessage("❌ Le formulaire n'a pas été trouvé (404).");
            }
        } catch (err) {
            console.error("Erreur DELETE :", err);
            setMessage("❌ Une erreur est survenue lors de la suppression.");
        }
    };



    const handleSaveFormulaires = async () => {
        try {
            // const res = await fetch("http://localhost:5000/api/formulaires/batch", {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/formulaires/batch`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formulaires),
            });
            if (res.ok) {
            setMessage("✅ Modifications enregistrées !");
            } else {
            setMessage("❌ Échec de l'enregistrement.");
            }
        } catch (err) {
            console.error(err);
            setMessage("❌ Une erreur est survenue.");
        }
    };




    //////////// ARCHIVES

    const handleAddNote = async () => {
        if (!newNote.title.trim()) return;

        const noteToSend = {
            title: newNote.title.trim(),
            content: newNote.content.trim() || "",
            date: newNote.date || new Date().toISOString().split("T")[0]
        };

        // const res = await fetch("http://localhost:5000/api/notes", {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(noteToSend),
        });

        if (res.ok) {
            const savedNote = await res.json();
            setEventNotes([...eventNotes, savedNote]);
            setNewNote({ title: "", content: "", date: "" });
            setMessage("✅ Note ajoutée !");
        }
    };


    const handleDeleteNote = async (id) => {
        try {
            // const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
            method: "DELETE",
            });

            if (res.ok) {
            setEventNotes(eventNotes.filter((note) => note.id !== id));
            setMessage("🗑️ Note supprimée !");
            } else {
            setMessage("❌ Échec de la suppression de la note.");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la note :", error);
            setMessage("❌ Une erreur est survenue.");
        }
    };

    const moveNote = (index, direction) => {
        const newNotes = [...eventNotes];
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= newNotes.length) return;

        // Échange des positions
        [newNotes[index], newNotes[targetIndex]] = [newNotes[targetIndex], newNotes[index]];

        setEventNotes(newNotes);

        // 📨 Enregistrement côté serveur
        // fetch("http://localhost:5000/api/notes/reorder", {
        fetch(`${import.meta.env.VITE_API_URL}/api/notes/reorder`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newNotes)
        })
        .then((res) => {
            if (!res.ok) throw new Error("Erreur serveur");
            showSaveMessage("✅ Ordre des notes enregistré");
        })
        .catch((err) => {
            console.error("❌ Erreur lors de la sauvegarde :", err);
            showSaveMessage("❌ Erreur enregistrement ordre des notes");
        });

    };




    ///////////// EQUIPE

    const uploadPhoto = async () => {
        if (!photoFile) return null;

        const formData = new FormData();
        formData.append("photo", photoFile);

        // const res = await fetch("http://localhost:5000/api/upload-photo", {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-photo`, {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            return data.url;
        } else {
            setMessage("❌ Erreur lors de l’upload de la photo.");
            return null;
        }
    };


    const handleAddMembre = async () => {
        if (!nouveauMembre.nom || !nouveauMembre.poste) return;

        let photoUrl = nouveauMembre.photo;

        // Si un fichier est sélectionné et pas d'URL manuelle
        if (photoFile && !photoUrl) {
            photoUrl = await uploadPhoto();
            if (!photoUrl) return; // arrêt si l'upload échoue
        }

        const membreToAdd = { ...nouveauMembre, photo: photoUrl };

        // const res = await fetch("http://localhost:5000/api/equipe", {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/equipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(membreToAdd),
        });

        if (res.ok) {
            const saved = await res.json();
            setEquipe([...equipe, saved]);
            setNouveauMembre({ nom: "", poste: "", photo: "" });
            setPhotoFile(null);
            setMessage("✅ Membre ajouté !");
        } else {
            setMessage("❌ Erreur ajout membre.");
        }
    };



    const handleDeleteMembre = async (id) => {
        // const res = await fetch(`http://localhost:5000/api/equipe/${id}`, { method: "DELETE" });
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/equipe/${id}`, { method: "DELETE" });
        if (res.ok) {
            setEquipe(equipe.filter((m) => m.id !== id));
            setMessage("🗑️ Membre supprimé.");
        } else {
            setMessage("❌ Suppression échouée.");
        }
    };

    const moveMembre = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= equipe.length) return;

        const newEquipe = [...equipe];
        const temp = newEquipe[index];
        newEquipe[index] = newEquipe[newIndex];
        newEquipe[newIndex] = temp;

        setEquipe(newEquipe);

        // ✅ Envoie la nouvelle liste via fetch
        fetch("/api/equipe/reorder", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(newEquipe),
        })
            .then((res) => {
            if (!res.ok) throw new Error("Erreur serveur");
            console.log("Ordre de l’équipe mis à jour");
            })
            .catch((err) => {
            console.error("Erreur lors de la sauvegarde :", err);
            });
    };

    return (
        <div className="admin-panel">
        <h1><center>Interface d'administration</center></h1>

        <div className="admin-tabs">
            <button onClick={() => setActiveTab("accueil")}>🏠 Accueil</button>
            <button onClick={() => setActiveTab("formulaires")}>📄 Formulaires</button>
            <button onClick={() => setActiveTab("archives")}>📁 Archives</button>
            <button onClick={() => setActiveTab("presentation")}>🎨 Présentation</button>
            <button onClick={() => setActiveTab("equipe")}>👥 Équipe</button>
            <button onClick={() => setActiveTab("contact")}>📬 Contact</button>
            <button onClick={() => setActiveTab("partenaires")}>🤝 Partenaires</button>

        </div>

        {activeTab === "accueil" && (
            <div className="accueil-tab">
                <AccueilManager />
            </div>
        )}



        
        {activeTab === "formulaires" && (
            <div className="formulaires-tab">
                <h2>📄 Liens de formulaires d'inscription</h2>

                {formulaires.length === 0 ? (
                <p>Aucun formulaire pour le moment.</p>
                ) : (
                <ul className="formulaire-list">
                    {formulaires.map((form) => (
                    <li key={form.id} className="formulaire-item">
                        <strong>{form.name}</strong><br />
                        <a href={form.url} target="_blank" rel="noopener noreferrer">{form.url}</a>
                        <button onClick={() => handleDeleteForm(form.id)}>🗑️ Supprimer</button>
                    </li>
                    ))}
                </ul>
                )}

                <h2 style={{ marginTop: "3rem" }}>➕ Ajouter un formulaire</h2>
                <div className="add-form-section">
                    <input
                        type="text"
                        placeholder="Nom du formulaire"
                        value={newForm.name}
                        onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                        className="form-input"
                    />
                    <input
                        type="url"
                        placeholder="URL du formulaire"
                        value={newForm.url}
                        onChange={(e) => setNewForm({ ...newForm, url: e.target.value })}
                        className="form-input"
                    />
                    <div className="form-actions">
                        <button onClick={() => handleAddForm(newForm)}>Ajouter</button>
                        <button onClick={handleSaveFormulaires}>💾 Enregistrer le(s) formulaire(s)</button>
                    </div>
                </div>
            </div>
        )}


        {activeTab === "archives" && (
            <div className="tab-tab">

                <div className="archive-section">
                <h3>📷 Galerie photos</h3>
                <GalleryManager />
                </div>

                <div className="archive-section">
                <h3>📝 Notes d'événements</h3>

                {saveMessage && (
                    <div className="save-message">{saveMessage}</div>
                )}

                <div className="note-form">
                    <input
                    type="text"
                    className="note-title-input"
                    placeholder="Titre de la note"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    />
                    <textarea
                    className="note-content-input"
                    placeholder="Contenu de la note"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    />
                    <input
                    type="date"
                    value={newNote.date}
                    onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                    className="note-date-input"
                    />
                    <button onClick={handleAddNote} className="add-button-violet">➕ Ajouter une note</button>
                </div>

                {eventNotes.length === 0 ? (
                    <p>Aucune note enregistrée.</p>
                ) : (
                    <div className="note-list">
                    {eventNotes.map((note, index) => (
                        <div key={note.id} className="note-item-admin">
                        <strong>{note.title}</strong><br />
                        <em>{note.content}</em><br />
                        {note.date && <small>📅 {new Date(note.date).toLocaleDateString()}</small>}
                        <div className="note-actions">
                            <button disabled={index === 0} onClick={() => moveNote(index, -1)}>⬆️</button>
                            <button disabled={index === eventNotes.length - 1} onClick={() => moveNote(index, 1)}>⬇️</button>
                            <button onClick={() => handleDeleteNote(note.id)}>🗑️ Supprimer</button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>

            </div>
        )}


        {activeTab === "equipe" && (
            <div className="tab-tab">
                <h2>👥 Membres de l'équipe</h2>

                {equipe.length === 0 ? (
                    <p>Aucun membre pour l’instant.</p>
                    ) : (
                    <div className="equipe-grid">
                        {equipe.map((m, index) => (
                        <div className="equipe-card" key={m.id}>
                            {m.photo && (
                            <img src={m.photo} alt={m.nom} className="equipe-photo" />
                            )}
                            <h3>{m.nom}</h3>
                            <p>{m.poste}</p>

                            <div className="flex justify-center gap-2 mt-2">
                            <button disabled={index === 0} onClick={() => moveMembre(index, -1)}>⬅️</button>
                            <button disabled={index === equipe.length - 1} onClick={() => moveMembre(index, 1)}>➡️</button>
                            </div>

                            <button onClick={() => handleDeleteMembre(m.id)} style={{ marginTop: '0.5rem' }}>🗑️ Supprimer</button>
                        </div>
                        ))}
                    </div>
                    )}

                <h3 style={{ marginTop: "2rem" }}>➕ Ajouter un membre</h3>
                <div className="add-form-section">
                <input
                    type="text"
                    placeholder="Nom"
                    value={nouveauMembre.nom}
                    onChange={(e) => setNouveauMembre({ ...nouveauMembre, nom: e.target.value })}
                    className="form-input"
                />
                <input
                    type="text"
                    placeholder="Poste"
                    value={nouveauMembre.poste}
                    onChange={(e) => setNouveauMembre({ ...nouveauMembre, poste: e.target.value })}
                    className="form-input"
                />
                <select
                    value={nouveauMembre.type}
                    onChange={(e) => setNouveauMembre({ ...nouveauMembre, type: e.target.value })}
                    className="form-input"
                    >
                    <option value="">Sélectionner un type</option>
                    <option value="prof">Professeur</option>
                    <option value="CA">CA</option>
                </select>

                <input
                    type="text"
                    placeholder="URL de la photo (optionnel)"
                    value={nouveauMembre.photo}
                    onChange={(e) => setNouveauMembre({ ...nouveauMembre, photo: e.target.value })}
                    className="form-input"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    className="form-input"
                />
                <small>Choisir un fichier OU entrer une URL ci-dessus.</small>

                
                <button onClick={handleAddMembre} className="add-button-violet">Ajouter</button>
                </div>
            </div>
        )}

        {activeTab === "contact" && (
            <div className="contact-admin-container">
                <h2>📬 Informations de contact</h2>
                <p>Modifier les coordonnées de contact ou messages affichés.</p>

                <label>
                Téléphone :
                <input
                    type="text"
                    name="phone"
                    value={contact.phone}
                    onChange={handleContactChange}
                    placeholder="04 74 75 00 81"
                />
                </label>

                <label>
                Email :
                <input
                    type="email"
                    name="email"
                    value={contact.email}
                    onChange={handleContactChange}
                    placeholder="ecole@artsmusique-hb.fr"
                />
                </label>

                <label>
                    Lien Facebook :
                    <input
                        type="url"
                        name="facebook"
                        value={contact.facebook}
                        onChange={handleContactChange}
                        placeholder="https://www.facebook.com/..."
                    />
                    </label>

                    <label>
                    Lien Instagram :
                    <input
                        type="url"
                        name="instagram"
                        value={contact.instagram}
                        onChange={handleContactChange}
                        placeholder="https://www.instagram.com/..."
                    />
                </label>


                <button onClick={handleSaveContact} >💾 Enregistrer</button>
            </div>
            )}


        {activeTab === "partenaires" && (
            <div className="tab-tab">
                <h2>🤝 Logos des partenaires</h2>
                <PartenaireManager />
            </div>
        )}


        {activeTab === "presentation" && (
            <PresentationManager />
        )}




        {message && <div className="admin-message">{message}</div>}

        <button className="logout-button" onClick={onLogout}>Se déconnecter</button>
        </div>
    );
}
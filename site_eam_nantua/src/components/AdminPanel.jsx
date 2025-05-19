import { useState, useEffect } from "react";
import "./AdminPanel.css";

export default function AdminPanel({ onLogout }) {
    const [activeTab, setActiveTab] = useState("formulaires");
    const [formulaires, setFormulaires] = useState([]);
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState({ phone: "", email: "" });

    const [eventNotes, setEventNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "" });

    const [newForm, setNewForm] = useState({ name: "", url: "" });

    useEffect(() => {
        // Récupération des formulaires A FAIRE, ICI EXEMPLE
        fetch("http://localhost:5000/api/formulaires")
            .then((res) => res.json())
            .then((data) => setFormulaires(data));

        // Récupération des infos de contact
        fetch("http://localhost:5000/api/contact")
            .then((res) => res.json())
            .then((data) => setContact(data));

        fetch("http://localhost:5000/api/notes")
            .then((res) => res.json())
            .then((data) => {
                const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setEventNotes(sorted);
            });
    }, []);



    const confirmAction = (message, callback) => {
        if (window.confirm(message)) {
            callback();
        }
    };


    const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact({ ...contact, [name]: value });
    };

    const handleSaveContact = async () => {
    const res = await fetch("http://localhost:5000/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
    });
    if (res.ok) {
        setMessage("✅ Informations de contact mises à jour !");
    }
    };


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
            const res = await fetch(`http://localhost:5000/api/formulaires/${id}`, {
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
            const res = await fetch("http://localhost:5000/api/formulaires/batch", {
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


    const handleAddNote = async () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return;

        const res = await fetch("http://localhost:5000/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newNote),
        });

        if (res.ok) {
            const savedNote = await res.json();
            setEventNotes([...eventNotes, savedNote]);
            setNewNote({ title: "", content: "" });
            setMessage("✅ Note ajoutée !");
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
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

        [newNotes[index], newNotes[targetIndex]] = [newNotes[targetIndex], newNotes[index]];
        setEventNotes(newNotes);
    };




    return (
        <div className="admin-panel">
        <h1><center>Interface d'administration</center></h1>

        <div className="admin-tabs">
            <button onClick={() => setActiveTab("formulaires")}>📄 Formulaires</button>
            <button onClick={() => setActiveTab("archives")}>📁 Archives</button>
            <button onClick={() => setActiveTab("accueil")}>🏠 Accueil</button>
            <button onClick={() => setActiveTab("contact")}>📬 Contact</button>
        </div>

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
            <div className="formulaires-tab">
                <h2>📁 Notes d'événements</h2>

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
                    ></textarea>

                    <input
                        type="date"
                        value={newNote.date}
                        onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                        className="note-date-input"
                    />

                    <button onClick={handleAddNote}>➕ Ajouter une note</button>
                </div>

                {eventNotes.length === 0 ? (
                <p>Aucune note enregistrée.</p>
                ) : (
                <div className="note-list">
                    {eventNotes.map((note, index) => (
                        <div key={note.id} className="note-item-admin">
                            <strong>{note.title}</strong><br />
                            <em>{note.content}</em><br />
                            {note.date && <small>📅 {note.date}</small>}<br />

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
            )}


        {activeTab === "accueil" && (
            <div className="formulaires-tab">
            <h2>🏠 Contenu de la page d’accueil</h2>
            <p>Ici tu pourras modifier les textes ou éléments de la page d'accueil.</p>
            </div>
        )}

        {activeTab === "contact" && (
            <div className="formulaires-tab">
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

                <button onClick={handleSaveContact}>💾 Enregistrer</button>
            </div>
            )}


        {message && <div className="admin-message">{message}</div>}

        <button className="logout-button" onClick={onLogout}>Se déconnecter</button>
        </div>
    );
}
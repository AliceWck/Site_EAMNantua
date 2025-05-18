import { useState, useEffect } from "react";
import "./AdminPanel.css";

export default function AdminPanel({ onLogout }) {
    const [activeTab, setActiveTab] = useState("formulaires");
    const [formulaires, setFormulaires] = useState([]);
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState({ phone: "", email: "" });

    const [eventNotes, setEventNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "" });

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
            .then((data) => setEventNotes(data));
    }, []);


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


    const handleAddForm = async () => {
        const res = await fetch("http://localhost:5000/api/formulaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Formulaire ${Date.now()}` }),
        });
        if (res.ok) {
        const newForm = await res.json();
        setFormulaires([...formulaires, newForm]);
        setMessage("✅ Formulaire ajouté !");
        }
    };

    const handleDeleteForm = async (id) => {
        const res = await fetch(`http://localhost:5000/api/formulaires/${id}`, {
        method: "DELETE",
        });
        if (res.ok) {
        setFormulaires(formulaires.filter((f) => f.id !== id));
        setMessage("❌ Formulaire supprimé !");
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
            <h2>Formulaires existants</h2>
            {formulaires.length === 0 ? (
                <p>Aucun formulaire pour le moment.</p>
            ) : (
                <ul className="formulaire-list">
                {formulaires.map((form) => (
                    <li key={form.id}>
                    {form.name}
                    <button onClick={() => handleDeleteForm(form.id)}>Supprimer</button>
                    </li>
                ))}
                </ul>
            )}
            <button onClick={handleAddForm}>➕ Ajouter un formulaire</button>
            </div>
        )}

        {activeTab === "archives" && (
            <div className="formulaires-tab">
                <h2>📁 Notes d'événements</h2>

                <div className="note-form">
                <input
                    type="text"
                    placeholder="Titre de la note"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <textarea
                    placeholder="Contenu de la note"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                ></textarea>
                <button onClick={handleAddNote}>➕ Ajouter une note</button>
                </div>

                {eventNotes.length === 0 ? (
                <p>Aucune note enregistrée.</p>
                ) : (
                <ul className="note-list">
                    {eventNotes.map((note) => (
                    <li key={note.id} className="note-item-admin">
                        <strong>{note.title}</strong><br />
                        <em>{note.content}</em><br />
                        <button onClick={() => handleDeleteNote(note.id)}>🗑️ Supprimer</button>
                    </li>
                    ))}
                </ul>
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

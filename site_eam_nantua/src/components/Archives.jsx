import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Archives.css";
import { Link } from "react-router-dom";

export default function Photos() {
  const [galleries, setGalleries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [openNote, setOpenNote] = useState(null);

  useEffect(() => {
    // Charger les galeries dynamiquement
    fetch("/api/galleries")
      .then((res) => res.json())
      // .then((data) => setGalleries(Array.isArray(data) ? data : []))
      .then((data) => {
        console.log("Galleries reçues :", data); // 👀 Ajoute un console.log ici
        setGalleries(data);
      })
      .catch((err) => console.error("Erreur fetch galleries :", err));

    // Charger les notes
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => {
        console.log("Notes reçues :", data);
        setNotes(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erreur fetch notes :", err));
  }, []);

  return (
    <div className="layout">
      <Header />
      <main className="photos-container">
        <section className="hero-section-archives">
          <h4>Archives</h4>
        </section>


        <h2 className="section-title"><br />Galerie Photos</h2>
        <div className="photos-grid">
          {galleries.map((gallery, i) => (
            <Link to={`/evenements/${gallery.id}`} key={i} className="photo-item">
              <img src={gallery.images?.[0]?.url || gallery.images?.[0] || "/placeholder.jpg"} alt={gallery.title} />
              <div className="photo-caption">{gallery.title}</div>
            </Link>
          ))}
        </div>

        <h2 className="section-title"><br />Carnet d'événements</h2>
        <div className="notes-grid">
          {notes.map((note, i) => (
            <div key={i} className="note-item" onClick={() => setOpenNote(openNote === i ? null : i)}>
              <div className="note-title">{note.title}</div>
              {openNote === i && <div className="note-content">{note.content}</div>}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

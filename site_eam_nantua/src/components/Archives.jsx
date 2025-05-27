import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Archives.css";
import { Link } from "react-router-dom";

export default function Photos() {
  const galleries = [
    { title: "Tournoi 2023", slug: "tournoi-2023", thumbnail: "/images/photo1.jpg" },
    { title: "Groupe EAM", slug: "groupe-eam", thumbnail: "/images/photo2.jpg" },
  ];

  // const [notes, setNotes] = useState({ title: "", content: "", date: "" });
  const [notes, setNotes] = useState([]);

  const [openNote, setOpenNote] = useState(null);

  useEffect(() => {
  fetch("http://localhost:5000/api/notes")
    .then((res) => res.json())
    .then((data) => {
      console.log("Notes reçues :", data); // 🐞 Vérifie ce que tu reçois
      setNotes(Array.isArray(data) ? data : []);
    })
    .catch((err) => console.error("Erreur fetch notes :", err));
  }, []);


  return (
    <div>
      <Header />
      <main className="photos-container">
        <h1>Archives</h1>

        <h2 className="section-title"><br />Galerie Photos</h2>
        <div className="photos-grid">
          {galleries.map((gallery, i) => (
            <Link to={`/evenements/${gallery.slug}`} key={i} className="photo-item">
              <img src={gallery.thumbnail} alt={gallery.title} />
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

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Archives.css";
import { Link } from "react-router-dom";

export default function Photos() {
  const galleries = [
    { title: "Tournoi 2023", slug: "tournoi-2023", thumbnail: "/images/photo1.jpg" },
    { title: "Groupe EAM", slug: "groupe-eam", thumbnail: "/images/photo2.jpg" },
  ];


  const notes = [
    {
      title: "🎄 Concert de Noël – 12 décembre 2025",
      content: "Un moment magique avec nos élèves de tous âges. La salle était comble et les performances émouvantes !"
    },
    {
      title: "🎶 Audition de printemps – 22 avril 2025",
      content: "Nos élèves ont présenté leur travail de l’année devant leurs proches. Beaucoup d’émotion et de fierté."
    }
  ];

  const [openNote, setOpenNote] = useState(null);
  
  return (
    <div>
      <Header />
      <main className="photos-container">
        <h1>Archives</h1>

        <h2 className="section-title"><br></br>Galerie Photos</h2>
        <div className="photos-grid">
          {galleries.map((gallery, i) => (
            <Link to={`/evenements/${gallery.slug}`} key={i} className="photo-item">
              <img src={gallery.thumbnail} alt={gallery.title} />
              <div className="photo-caption">{gallery.title}</div>
            </Link>
          ))}
        </div>

        <h2 className="section-title"><br></br>Carnet d'événements</h2>
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

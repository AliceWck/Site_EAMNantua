import Header from "./Header";
import Footer from "./Footer";
import "./EvenementPage.css";
import { useParams, useNavigate } from "react-router-dom";


export default function EvenementPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ⚠️ temporaire : photos en dur pour chaque slug
  const allPhotos = {
    "tournoi-2023": [
      "/images/tournoi2023/1.jpg",
      "/images/tournoi2023/2.jpg",
    ],
    "groupe-eam": [
      "/images/eam/1.jpg",
      "/images/eam/2.jpg",
    ]
  };

  const photos = allPhotos[slug] || [];

  return (
    <div>
      <Header />
      <main className="evenement-container">
        <button className="back-button" onClick={() => navigate(-1)}>← Retour</button>
        <h1>{slug.replace("-", " ").toUpperCase()}</h1>
        <div className="photos-grid">
          {photos.map((src, i) => (
            <div key={i} className="photo-item">
              <img src={src} alt={`Photo ${i + 1}`} />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
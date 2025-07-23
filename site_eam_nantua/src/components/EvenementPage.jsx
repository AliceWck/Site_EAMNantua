import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./EvenementPage.css";
import { useParams, useNavigate } from "react-router-dom";

export default function EvenementPage() {
  const { slug } = useParams(); // slug = id de la galerie
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const API = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API}/api/galleries`);
        const data = await res.json();
        const found = data.find((g) => g.id === slug);
        setGallery(found);
      } catch (err) {
        console.error("Erreur chargement galerie :", err);
      }
    };

    fetchGallery();
  }, [slug]);

  if (!gallery) {
    return (
      <div>
        <Header />
        <main className="evenement-container">
          <p>Chargement...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const API = import.meta.env.VITE_API_URL;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="evenement-container">
        <h1>{gallery.title}</h1>
        <div className="photos-grid">
          {gallery.images?.map((src, i) => (
            <div key={i} className="photo-item">
              <img
                src={
                  typeof src === "string"
                    ? src.startsWith("http")
                      ? src
                      : `${API}/uploads/${src}`
                    : src.url.startsWith("http")
                    ? src.url
                    : `${API}/uploads/${src.url}`
                }
                alt={`Photo ${i + 1}`}
              />
            </div>
          ))}
        </div>
        <button className="back-button" onClick={() => navigate(-1)}>← Retour</button>
      </main>
      <Footer />
    </div>
  );

}

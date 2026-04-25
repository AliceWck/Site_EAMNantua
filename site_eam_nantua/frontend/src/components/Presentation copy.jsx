import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Presentation.css";

export default function Presentation() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    // Remplacez par un appel API réel dans un projet fullstack
    fetch("/api/presentation-content")
      .then((res) => res.json())
      .then(setContent);
  }, []);

  if (!content) return <p>Chargement...</p>;
  return (
    <div className="presentation-container">
      <Header />
      <main className="presentation-main">
        <section className="hero-section-pres">
          <h1>École des Arts et Musique du Haut Bugey</h1>
          <p className="subtitle">Un lieu d’épanouissement artistique pour tous les âges</p>
        </section>

        <section className="info-section">
          <div className="info-card">
            <h2>🎵 Notre mission</h2>
            <p>À compléter </p>
          </div>

          <div className="info-card">
            <h2>📍 Où nous trouver</h2>
            <p>31 rue du docteur Mercier, Nantua, France</p>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2782.7327931790173!2d5.605994915801201!3d46.1547640791141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c9a55fd989eab%3A0x8d86b3f037b97a0e!2s31%20Rue%20du%20Docteur%20Mercier%2C%2001100%20Nantua%2C%20France!5e0!3m2!1sfr!2sfr!4v1715958412345!5m2!1sfr!2sfr"
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: "0.5rem", marginTop: "1rem" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Carte de l'école"
            ></iframe>
          </div>

          <div className="info-card">
            <h2>📆 Cours proposés</h2>
            <p>Voici ci-dessous la liste des cours proposés. Les horaires sont quant à eux décidés en accords avec les professeurs lors de votre inscription.</p>
          </div>
        </section>

        <section className="cta-section">
          <h2>Prêt·e à commencer ?</h2>
          <a href="/inscription" className="cta-button">Inscrivez-vous ici</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}

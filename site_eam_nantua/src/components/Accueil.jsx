import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import "./Accueil.css";

export default function Accueil() {
  const [facts, setFacts] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageVersion, setImageVersion] = useState(null);

  useEffect(() => {
    fetch("/api/facts")
      .then(res => res.json())
      .then(data => setFacts(data))
      .catch(err => console.error("Erreur chargement facts:", err));

    // Récupérer image et version dynamiquement
    fetch("/api/accueil-image")
      .then(res => res.json())
      .then(data => {
        setImageUrl(data.imageUrl);
        setImageVersion(data.version);
      })
      .catch(err => {
        console.error("Erreur chargement image accueil:", err);
        // fallback si besoin
        setImageUrl("/images/accueil/accueil.jpeg");
        setImageVersion(Date.now());
      });
  }, []);


  const heroStyle = {
    backgroundImage: imageUrl
      ? `url('${imageUrl}?v=${imageVersion}')`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    overflow: "hidden",
    height: "70vh",
    position: "relative",
  };


  return (
    <div className="layout">
      <Header />

      <section className="hero-container" style={heroStyle}>
        <div className="hero-overlay">
          <div className="accueil-hero-text">
            <h1 className="hero-title">
              Bienvenue à l'École des Arts et Musique du Haut-Bugey !
            </h1>
            <p className="hero-subtitle">
              Un lieu d’expression, de partage et d’apprentissage artistique.
            </p>
          </div>
        </div>
      </section>

      <section className="accueil-facts">
        <p className="accueil-fact-item">
          Découvrez tous les cours proposés (horaires et tarifs){" "}
          <Link to="/presentation" className="inline-link">
            ICI
          </Link>
          .
        </p>
        <p className="accueil-fact-item">
          Inscrivez-vous dès maintenant{" "}
          <Link to="/inscription" className="inline-link">
            ICI
          </Link>
          .
        </p>
      </section>

      {/* Actualités remplacées par facts dynamiques */}
      <section className="accueil-news">
        <h2>À la une</h2>
        <div className="news-list">
          {facts.length > 0 ? (
            facts.map((fact) => (
              <div key={fact.id} className="news-item">
                <h3>
                  {fact.icon && <span>{fact.icon} </span>}
                  {fact.title}
                </h3>
                <p>{fact.value}</p>
              </div>
            ))
          ) : (
            <p>Chargement des actualités...</p>
          )}
        </div>
      </section>

      <section className="accueil-reseaux">
        <h2>Réseaux sociaux</h2>
        <p>Vous pouvez également nous suivre sur ces différentes plateformes :</p>
        <div className="reseaux-icons">
          <a
            href="https://www.facebook.com/p/Ecole-Arts-et-Musique-du-Haut-Bugey-100038170507594/?locale=fr_FR"
            target="_blank"
            rel="noopener noreferrer"
            className="reseau-link"
          >
            <img src="/images/logos/logo-fb-2.png" alt="Facebook" />
          </a>
          <a
            href="https://www.instagram.com/ecoleartsetmusiquenantua/"
            target="_blank"
            rel="noopener noreferrer"
            className="reseau-link"
          >
            <img src="/images/logos/logo-insta-2.png" alt="Instagram" />
          </a>
          <a href="mailto:ecole@artsmusique-hb.fr" className="reseau-link">
            <img src="/images/logos/logo-mail.png" alt="Mail" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import "./Accueil.css";

export default function Accueil() {
  const [facts, setFacts] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageVersion, setImageVersion] = useState(null);
  const [contact, setContact] = useState({
    email: "",
    facebook: "",
    instagram: ""
  });

  const API = import.meta.env.VITE_API_URL;

  const logoPath = (filename) => `${API}/uploads/logos/${filename}`;

  useEffect(() => {
    // fetch("/api/facts")
    fetch(`${API}/api/facts`)
      .then(res => res.json())
      .then(data => setFacts(data))
      .catch(err => console.error("Erreur chargement facts:", err));

    // Récupérer image et version dynamiquement
    // fetch("/api/accueil-image")
    fetch(`${API}/api/accueil-image`)
      .then(res => res.json())
      // .then(data => {
      //   if (data.imageUrl) {
      //     const fullUrl = data.imageUrl.startsWith("http")
      //       ? data.imageUrl
      //       : `${API}/uploads/accueil/${data.imageUrl}`;
      //     setImageUrl(fullUrl);
      //     setImageVersion(data.version || Date.now());
      //   }
      // })
      .then(data => {
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageVersion(data.version || Date.now());
        }
      })
      .catch(err => {
        console.error("Erreur chargement image accueil:", err);
        setImageUrl(`${API}/uploads/accueil/accueil.jpeg`);
        setImageVersion(Date.now());
      });

    // Charger contact (email, facebook, instagram)
    // fetch("/api/contact")
    fetch(`${API}/api/contact`)
      .then(res => res.json())
      .then(data => {
        setContact({
          email: data.email || "",
          facebook: data.facebook || "",
          instagram: data.instagram || ""
        });
      })
      .catch(err => console.error("Erreur chargement contact:", err));
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
            <p>Chargement des actualités... Rafraichir la page si besoin.</p>
          )}
        </div>
      </section>

      <section className="accueil-reseaux">
        <h2>Réseaux sociaux</h2>
        <p>Vous pouvez également nous suivre sur ces différentes plateformes :</p>
        <div className="reseaux-icons">
          {contact.facebook && (
            <a
              href={contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="reseau-link"
            >
              <img
                // src="/images/logos/logo-fb-2.png"
                src={logoPath("logo-fb-2.png")}
                alt="Facebook"
                className="reseau-logo"
              />
            </a>
          )}
          {contact.instagram && (
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="reseau-link"
            >
              <img
                // src="/images/logos/logo-insta-2.png"
                src={logoPath("logo-insta-2.png")}
                alt="Instagram"
                className="reseau-logo"
              />
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="reseau-link">
              <img
                // src="/images/logos/logo-mail.png"
                src={logoPath("logo-mail.png")}
                alt="Mail"
                className="reseau-logo"
              />
            </a>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

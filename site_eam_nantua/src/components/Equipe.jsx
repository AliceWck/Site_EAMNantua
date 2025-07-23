import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Equipe.css";

export default function Equipe() {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    // fetch("http://localhost:5000/api/equipe")
    fetch(`${import.meta.env.VITE_API_URL}/api/equipe`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de chargement");
        return res.json();
      })
      .then((data) => {
        setEquipe(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur fetch équipe :", err);
        setErreur("Impossible de charger l'équipe.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="equipe-page">
      <Header />
      <section className="hero-section-equipe">
        <h1>🎵 Notre équipe</h1>
        <p className="subtitle">Découvrez l’équipe pédagogique et administrative qui fait vivre l'école.</p>
      </section>

      <main className="equipe-main">

        {loading && <p>Chargement de l’équipe...</p>}
        {erreur && <p className="error">{erreur}</p>}

        {!loading && !erreur && (
        <>
          <section className="equipe-section">
            <h2>Conseil d’administration</h2>
            <div className="equipe-grid">
              {equipe.filter(p => p.type === "CA").map(personne => (
                <div className="equipe-card" key={personne.id}>
                  <div className="equipe-photo-wrapper">
                    <img
                      src={
                        personne.photo
                          ? `${import.meta.env.VITE_API_URL}/uploads/${personne.photo}`
                          : `${import.meta.env.VITE_API_URL}/uploads/equipe/avatardefaut.png`
                      }
                      alt={personne.nom}
                      className="equipe-photo"
                    />
                  </div>
                  <h3 className="equipe-nom">{personne.nom}</h3>
                  <p className="equipe-poste">{personne.poste}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="equipe-section">
            <h2>Professeurs</h2>
            <div className="equipe-grid">
              {equipe.filter(p => p.type === "prof").map(personne => (
                <div className="equipe-card" key={personne.id}>
                  <div className="equipe-photo-wrapper">
                    <img
                      src={
                        personne.photo
                          ? `${import.meta.env.VITE_API_URL}/uploads/${personne.photo}`
                          : `${import.meta.env.VITE_API_URL}/uploads/equipe/avatardefaut.png`
                      }
                      alt={personne.nom}
                      className="equipe-photo"
                    />
                  </div>
                  <h3 className="equipe-nom">{personne.nom}</h3>
                  <p className="equipe-poste">{personne.poste}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      </main>
      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Equipe.css";

export default function Equipe() {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/equipe")
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
      <main className="equipe-main">
        <h1>🎵 Notre équipe</h1>
        <p className="equipe-intro">
          Découvrez l’équipe pédagogique et administrative qui fait vivre l'école.
        </p>

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
                      src={personne.photo || "/images/equipe/avatardefaut.png"}
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
            <h2>Corps professoral</h2>
            <div className="equipe-grid">
              {equipe.filter(p => p.type === "prof").map(personne => (
                <div className="equipe-card" key={personne.id}>
                  <div className="equipe-photo-wrapper">
                    <img
                      src={personne.photo || "/images/equipe/avatardefaut.png"}
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

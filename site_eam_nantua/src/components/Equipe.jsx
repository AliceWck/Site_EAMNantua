import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Equipe.css";

const equipe = [
  {
    nom: "Claire Dubois",
    poste: "Directrice",
    photo: "/images/equipe/claire.jpg",
  },
  {
    nom: "Jean Martin",
    poste: "Professeur de piano",
    photo: "/images/equipe/jean.jpg",
  },
  {
    nom: "Lucie Morel",
    poste: "Professeure de chant",
    photo: "/images/equipe/lucie.jpg",
  },
  {
    nom: "Marc Lefevre",
    poste: "Professeur de guitare",
    photo: "/images/equipe/marc.jpg",
  },
  {
    nom: "Sophie Lambert",
    poste: "Assistante administrative",
    photo: "/images/equipe/sophie.jpg",
  },
];

export default function Equipe() {
  return (
    <div className="equipe-page">
      <Header />
      <main className="equipe-main">
        <h1>🎵 Notre équipe</h1>
        <p className="equipe-intro">
          Découvrez l’équipe pédagogique et administrative qui fait vivre l'école.
        </p>
        <div className="equipe-grid">
          {equipe.map((personne, index) => (
            <div className="equipe-card" key={index}>
              <div className="equipe-photo-wrapper">
                <img src={personne.photo} alt={personne.nom} className="equipe-photo" />
              </div>
              <h3 className="equipe-nom">{personne.nom}</h3>
              <p className="equipe-poste">{personne.poste}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

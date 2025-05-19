import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Inscription.css";

export default function Inscription() {
  const [formulaires, setFormulaires] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/formulaires")
      .then((res) => res.json())
      .then((data) => setFormulaires(data));
  }, []);

  return (
    <div className="inscription-container">
      <Header />
      <main className="inscription-main">
        <section className="inscription-hero">
          <h1 className="inscription-title">Inscription à l'École des Arts et Musique</h1>
          <p className="inscription-subtitle">
            Merci de remplir un des formulaires ci-dessous pour effectuer votre inscription.
          </p>
        </section>

        <div className="inscription-form-wrapper">
          {formulaires.length === 0 ? (
            <p>Chargement des formulaires...</p>
          ) : (
            formulaires.map((form) => (
              <div key={form.id} className="formulaire-item-bloc">
                <h3>{form.name}</h3>
                <iframe
                  src={form.url}
                  width="100%"
                  height="1000"
                  frameBorder="0"
                  marginHeight="0"
                  marginWidth="0"
                  title={form.name}
                  allowFullScreen
                >
                  Chargement…
                </iframe>
              </div>
            ))

          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

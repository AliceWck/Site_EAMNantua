import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Partenaires.css";

export default function Partenaires() {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/partenaires")
      .then(res => res.json())
      .then(data => setLogos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erreur fetch partenaires :", err));
  }, []);

  return (
    <div className="layout">
      <Header />
      <main className="partenaires-container">
        <section className="hero-section-partenaires">
          <h4>Nos Partenaires</h4>
        </section>

        <div className="logo-grid">
          {logos.map((logo) => (
            <img key={logo.id} src={logo.logo} alt={`logo partenaire ${logo.nom}`} className="logo-item" />
        ))}

        </div>
      </main>
      <Footer />
    </div>
  );
}

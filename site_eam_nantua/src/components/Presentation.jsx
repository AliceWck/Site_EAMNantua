import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Presentation.css";

export default function Presentation() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    // fetch("http://localhost:5000/api/presentation-content")
    fetch(`${import.meta.env.VITE_API_URL}/api/presentation-content`)
      .then((res) => res.json())
      .then((data) => setContent(data));
  }, []);


  if (!content) return <p>Chargement...</p>;
  return (
    <div className="presentation-container">
      <Header />
      <main className="presentation-main">
        <section className="hero-section-pres">
          <h1>{content.title}</h1>
          <p className="subtitle">{content.subtitle}</p>
        </section>

        <section className="info-section">
          <div className="info-card">
            <h2>🎵 Notre mission</h2>
            <p>{content.mission}</p>
          </div>

          <div className="info-card">
            <h2>📍 Où nous trouver</h2>
            <p>{content.address}</p>
            <iframe
              src={content.mapEmbedUrl}
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: "0.5rem", marginTop: "1rem" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div className="info-card">
            <h2>📆 Cours proposés</h2>
            <p>Voici ci-dessous la liste des cours proposés. Les horaires sont
              décidés en accord avec les professeurs.</p>
            <ul>
              {content.courses.map((course, index) => (
                <li key={index}>{course}</li>
              ))}
            </ul>
            {content.pdfUrl && content.pdfUrl.trim() !== "" ? (
              <div className="pdf-link">
                <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer">
                  📄 Voir le PDF des cours
                </a>
              </div>
            ) : null}

          </div>
        </section>

        <section className="cta-section">
          <h2>{content.cta.text}</h2>
          <a href={content.cta.link} className="cta-button">
            {content.cta.buttonText}
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}

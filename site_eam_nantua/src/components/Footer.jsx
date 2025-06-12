import { Link } from "react-router-dom";
import "./Footer.css";
import { useState, useEffect } from "react";

export default function Footer() {
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    fetch("/api/contact")
      .then(res => res.json())
      .then(data => {
        if (data.email) setContactEmail(data.email);
      })
      .catch(err => {
        console.error("Erreur chargement contact dans footer:", err);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-logos">
        <a href="https://www.facebook.com/p/Ecole-Arts-et-Musique-du-Haut-Bugey-100038170507594/?locale=fr_FR" target="_blank" rel="noopener noreferrer">
          <img src="/images/logos/logo-fb-2.png" alt="Facebook" />
        </a>
        <a href="https://www.instagram.com/ecoleartsetmusiquenantua/" target="_blank" rel="noopener noreferrer">
          <img src="/images/logos/logo-insta-2.png" alt="Instagram" />
        </a>
        <a href={`mailto:${contactEmail}`}>
          <img src="/images/logos/logo-mail.png" alt="Mail" />
        </a>
      </div>

      <div className="footer-partenaires">
        <a href="/partenaires">Partenaires</a>
      </div>

      <div className="footer-text">
        <div>© {new Date().getFullYear()} EAM Nantua — <Link to="/admin">Admin</Link></div>
        <div><Link to="/mentions">Mentions légales</Link></div>
      </div>
    </footer>

  );
}

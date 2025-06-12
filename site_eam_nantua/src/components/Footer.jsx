import { Link } from "react-router-dom";
import "./Footer.css";
import { useState, useEffect } from "react";

export default function Footer() {
  const [contact, setContact] = useState({
    email: "",
    facebook: "",
    instagram: ""
  });

  useEffect(() => {
    fetch("/api/contact")
      .then(res => res.json())
      .then(data => {
        setContact({
          email: data.email || "",
          facebook: data.facebook || "",
          instagram: data.instagram || ""
        });
      })
      .catch(err => {
        console.error("Erreur chargement contact dans footer:", err);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-logos">
         {contact.facebook && (
            <a href={contact.facebook} target="_blank" rel="noopener noreferrer">
              <img src="/images/logos/logo-fb-2.png" alt="Facebook" />
            </a>
          )}
          {contact.instagram && (
            <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
              <img src="/images/logos/logo-insta-2.png" alt="Instagram" />
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`}>
              <img src="/images/logos/logo-mail.png" alt="Mail" />
            </a>
          )}
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

import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logos">
        <a href="https://www.facebook.com/p/Ecole-Arts-et-Musique-du-Haut-Bugey-100038170507594/?locale=fr_FR" target="_blank" rel="noopener noreferrer">
          <img src="/images/logos/logo-fb-2.png" alt="Facebook" />
        </a>
        <a href="https://www.instagram.com/ecoleartsetmusiquenantua/" target="_blank" rel="noopener noreferrer">
          <img src="/images/logos/logo-insta-2.png" alt="Instagram" />
        </a>
        <a href="mailto:ecole@artsmusique-hb.fr">
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

import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <nav className="nav">
        <div className="nav-left">
            <Link to="/" className="logo-link">
                <img src="/Logo.png" alt="Logo EAM" className="logo" />
            </Link>
        </div>
        <div className="nav-right">
          <Link to="/">Accueil</Link>
          <Link to="/inscription">Inscription</Link>
          <Link to="/archives">Archives</Link>
          <Link to="/presentation">Qui sommes-nous</Link>
          <Link to="/contact">Nous contacter</Link>
        </div>
      </nav>
    </header>
  );
}

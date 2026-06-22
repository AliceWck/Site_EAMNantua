import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [showDonateLink, setShowDonateLink] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/dons`)
      .then((res) => res.json())
      .then((data) => {
        setShowDonateLink(data?.enabled && data?.helloassoUrl?.trim() !== "");
      })
      .catch(() => setShowDonateLink(false));
  }, []);

  return (
    <header className="header">
      <nav className="nav">
        <div className="nav-left">
            <Link to="/" className="logo-link">
                <img src={`${import.meta.env.VITE_API_URL}/uploads/logos/Logo.png`} alt="Logo EAM" className="logo" />
            </Link>
        </div>
        <div className="nav-right">
          <Link to="/">Accueil</Link>
          <Link to="/inscription">Inscription</Link>
          <Link to="/archives">Archives</Link>
          <Link to="/presentation">Qui sommes-nous</Link>
          <Link to="/equipe">L'équipe</Link>
          {showDonateLink && <Link to="/nous-soutenir">Nous soutenir</Link>}
          <Link to="/contact">Nous contacter</Link>
        </div>
      </nav>
    </header>
  );
}

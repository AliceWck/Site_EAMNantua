import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import "./Accueil.css";

export default function Accueil() {
    return (
        <div className="layout">
        <Header />

            <section className="hero-container">
                <div className="hero-overlay">
                    <div className="accueil-hero-text">
                    <h1 className="hero-title">
                        Bienvenue à l'École des Arts et Musique du Haut-Bugey !
                    </h1>
                    <p className="hero-subtitle">
                        Un lieu d’expression, de partage et d’apprentissage artistique.
                    </p>
                    </div>
                </div>
            </section>

            <section className="accueil-facts">
                <p className="fact-item">
                    Découvrez tous les cours proposés <Link to="/presentation" className="inline-link">ICI</Link>.
                </p>
                <p className="fact-item">
                    Inscrivez-vous dès maintenant <Link to="/inscription" className="inline-link">ICI</Link>.
                </p>
            </section>

            {/* Actualités */}
            <section className="accueil-news">
                <h2>À la une</h2>
                <div className="news-list">
                <div className="news-item">
                    <h3>🎶 Inscriptions 2025 ouvertes !</h3>
                    <p>Les inscriptions pour l’année prochaine sont ouvertes jusqu’au 30 juin. N’attendez pas pour réserver votre place.</p>
                </div>
                <div className="news-item">
                    <h3>📸 Retour sur la fête de fin d’année</h3>
                    <p>Une belle soirée riche en émotions et en musique ! Revivez les moments forts dans notre <Link to="/photos">galerie photos</Link>.</p>
                </div>
                <div className="news-item">
                    <h3>🎻 Nouveau cours de violon pour débutants</h3>
                    <p>À partir de septembre, un nouveau créneau spécialement pour les enfants entre 6 et 10 ans.</p>
                </div>
                </div>
            </section>

            <section className="accueil-reseaux">
                <h2>Réseaux sociaux</h2>
                <p>Vous pouvez également nous suivre sur ces différentes plateformes :</p>
                <div className="reseaux-icons">
                    <a href="https://www.facebook.com/p/Ecole-Arts-et-Musique-du-Haut-Bugey-100038170507594/?locale=fr_FR" target="_blank" rel="noopener noreferrer" className="reseau-link">
                    <img src="/images/logos/logo-fb-2.png" alt="Facebook" />
                    </a>
                    <a href="https://www.instagram.com/ecoleartsetmusiquenantua/" target="_blank" rel="noopener noreferrer" className="reseau-link">
                    <img src="/images/logos/logo-insta-2.png" alt="Instagram" />
                    </a>
                    <a href="mailto:ecole@artsmusique-hb.fr" className="reseau-link">
                    <img src="/images/logos/logo-mail.png" alt="Mail" />
                    </a>
                </div>
            </section>


            <Footer />
        </div>
    );
}

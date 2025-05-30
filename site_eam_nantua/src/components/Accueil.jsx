import Header from "./Header";
import Footer from "./Footer";
import "./Accueil.css";

export default function Accueil() {
  return (
    <div className="accueil-container">
      <Header />
      <main className="accueil-background">
        <div className="accueil-content">
          <h1 className="accueil-title">
            Ecole des Arts et Musique du Haut-Bugey
          </h1>
          <p>Ceci est la page d’accueil.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

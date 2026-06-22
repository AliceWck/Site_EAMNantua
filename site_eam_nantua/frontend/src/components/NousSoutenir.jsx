import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./NousSoutenir.css";

export default function NousSoutenir() {
  const [donConfig, setDonConfig] = useState(null);
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/api/dons`)
      .then((res) => res.json())
      .then((data) => setDonConfig(data))
      .catch((err) => {
        console.error("Erreur chargement page Nous soutenir :", err);
        setDonConfig({ enabled: false, message: "", helloassoUrl: "" });
      });
  }, [API]);

  if (!donConfig) {
    return <p>Chargement...</p>;
  }

  const defaultMessage =
    "Vous pouvez soutenir l'association en faisant un don via HelloAsso. Chaque contribution aide à faire vivre nos projets musicaux, soutenir nos professeurs et offrir plus d'expériences artistiques à nos élèves.";

  return (
    <div className="nous-soutenir-page">
      <Header />
      <main className="nous-soutenir-main">
        <section className="soutien-hero">
          <div className="soutien-card">
            <h1>💖 Nous soutenir</h1>
            <p>{donConfig.message?.trim() ? donConfig.message : defaultMessage}</p>
            {donConfig.enabled && donConfig.helloassoUrl ? (
              <a
                className="helloasso-button"
                href={donConfig.helloassoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Faire un don via HelloAsso
              </a>
            ) : (
              <p className="soutien-disabled">
                La page de dons est momentanément désactivée ou le lien HelloAsso n'est pas encore renseigné.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

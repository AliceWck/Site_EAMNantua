import Header from "./Header";
import Footer from "./Footer";
import "./Inscription.css";

export default function Inscription() {
  return (
    <div className="inscription-container">
      <Header />
      <main className="inscription-main">
        <section className="inscription-hero">
          <h1 className="inscription-title">Inscription à l'École des Arts et Musique</h1>
          <p className="inscription-subtitle">
            Merci de remplir le formulaire ci-dessous pour effectuer votre inscription.
            </p>
            <p>
            Vous pouvez inscrire plusieurs personnes à la fois : il suffit de remplir le formulaire pour chacune, puis de le valider. Il est ensuite possible de remplir d'autres formulaires.
          </p>
        </section>

        <div className="inscription-form-wrapper">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSdK2F2DnifkIXdQgpyKAogw3NIQ6Tq_L-CYvvI4eJWp-F6Hgg/viewform?embedded=true"
            width="100%"
            height="1000"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
            title="Formulaire d'inscription"
            allowFullScreen
          >
            Chargement…
          </iframe>
        </div>
      </main>
      <Footer />
    </div>
  );
}

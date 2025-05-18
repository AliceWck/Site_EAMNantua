import Header from "./Header";
import Footer from "./Footer";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="contact-page">
      <Header />
      <main className="contact-main">
        <h1>Contactez-nous</h1>
        <p>Pour toute question ou information, vous pouvez nous contacter...</p>

        <div className="contact-infos">
          <p><strong>📞 Par téléphone :</strong> {contact.phone}</p>
          <p><strong>📧 Par email :</strong> {contact.email}</p>
        </div>

        <p><br />Ou nous écrire directement ici :</p>
        {/* <form className="contact-form" onSubmit={(e) => e.preventDefault()}> */}
        <form className="contact-form" action="https://formsubmit.co/alice.invernizzi@outlook.fr" method="POST">
          <label>
            Nom :
            <input type="text" name="name" placeholder="Votre nom" required />
          </label>

          <label>
            Email :
            <input type="email" name="email" placeholder="votre@email.com" required />
          </label>

          <label>
            Message :
            <textarea name="message" rows="5" placeholder="Votre message..." required />
          </label>

          <button type="submit">Envoyer</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

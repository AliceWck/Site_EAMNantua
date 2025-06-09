import Header from "./Header";
import Footer from "./Footer";
import "./Contact.css";
import React, { useEffect, useState } from "react";


export default function Contact() {
  const [contact, setContact] = useState(null); // 🔧 1. Initialisation

  useEffect(() => {
    // 🔧 2. Récupération des infos de contact depuis l'API
    fetch("http://localhost:5000/api/contact")
      .then((res) => res.json())
      .then((data) => setContact(data))
      .catch((err) => console.error("Erreur de chargement des contacts :", err));
  }, []);

  if (!contact) {
    return <p>Chargement des informations de contact...</p>;
  }

  return (
    <div className="contact-page">
      <Header />
      <section className="hero-section-contact">
          <h1>Contactez-nous</h1>
          <p className="subtitle">Pour toute question ou information, vous pouvez nous joindre...</p>
      </section>

      <main className="contact-main contact-padding">

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

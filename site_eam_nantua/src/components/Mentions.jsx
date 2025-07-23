import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import "./Mentions.css";

function Mentions() {
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/contact`)
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setContactEmail(data.email);
      })
      .catch((err) => {
        console.error("Erreur chargement email contact :", err);
      });
  }, []);

  return (
    <>
      <Header />

      <div id="mentions">
        <div id="contentMentions">
          <h3 id="mentionsTitle">Mentions Légales</h3>
          <hr />

          <p className="mentionsSTitle">MENTIONS LÉGALES - ASSOCIATION DE LOI 1901 :</p>
          <p className="mentionsSubtitle">IDENTITÉ</p>
          <p>
            Nom de l'association : Ecole Arts et Musique du Haut-Bugey<br />
            Adresse Siège Social : 31 rue du Docteur Mercier 01130 NANTUA <br />
            Téléphone : 04 74 75 00 81<br />
            Président.e de l’Association : Karine ESCANDE<br />
            Co-Président.e : Laila PINEDE<br />
            Association loi 1901
          </p>

          <p className="mentionsSubtitle">HÉBERGEUR</p>
          <p>
            Scaleway xxxxxxx<br />
            8 rue de la Ville l’Evêque, 75008 Paris, France xxxxxxxxxx<br />
            +33 1 84 13 00 00 xxxxxxxxxxxx
          </p>

          <p className="mentionsSTitle">CONDITIONS D’UTILISATION DU SITE WEB :</p>
          <p>
            L’utilisation du présent site implique l’acceptation pleine et entière des conditions générales d’utilisation décrites ci-après. Ces conditions d’utilisation sont susceptibles d’être modifiées ou complétées à tout moment.
          </p>

          <p className="mentionsSubtitle">INFORMATIONS</p>
          <p>
            Les informations et documents du site sont présentés à titre indicatif, sans caractère exhaustif, et ne peuvent engager la responsabilité du propriétaire du site.<br />
            Le propriétaire du site ne peut être tenu responsable des dommages directs et indirects consécutifs à l’accès au site.
          </p>

          <p className="mentionsSubtitle">PROPRIÉTÉ INTELLECTUELLE</p>
          <p>
            Sauf mention contraire, tous les éléments accessibles sur le site (textes, images, graphismes, logo, icônes, sons, logiciels, etc.) restent la propriété exclusive de leurs auteurs.<br />
            Toute reproduction ou représentation est interdite sans autorisation écrite.<br />
            Toute exploitation non autorisée est constitutive de contrefaçon et passible de poursuites.<br />
            Les marques et logos reproduits sont la propriété de leurs titulaires respectifs.
          </p>

          <p className="mentionsSubtitle">LIENS</p>
          <p>
            <strong>Liens sortants :</strong><br />
            Le propriétaire du site décline toute responsabilité concernant les ressources tierces accessibles via des liens.<br />
            <strong>Liens entrants :</strong><br />
            Les liens vers ce site sont autorisés sous certaines conditions (fenêtre distincte, clarté, absence de confusion). Le site se réserve le droit de demander le retrait de tout lien non conforme.
          </p>

          <p className="mentionsSTitle">DONNÉES PERSONNELLES</p>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, de suppression et d’opposition à vos données personnelles.<br />
            Les données collectées via Google Forms sont utilisées uniquement pour les inscriptions aux activités de l'association Ecole Arts et Musique du Haut-Bugey. Elles ne sont ni revendues ni partagées.<br />
            Contact : {contactEmail ? (
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            ) : (
              "Chargement en cours..."
            )}
          </p>

          <p className="mentionsSubtitle">PHOTOGRAPHIES ET DROIT À L’IMAGE</p>
          <p>
            Des photos prises lors d’événements peuvent apparaître sur ce site.<br />
            Pour demander leur retrait, contactez : {contactEmail ? (
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            ) : (
              "Chargement en cours..."
            )}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Mentions;

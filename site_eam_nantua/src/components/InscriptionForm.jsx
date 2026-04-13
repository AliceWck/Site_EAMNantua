import React, { useState, useEffect, useCallback } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./InscriptionForm.css";

const API = import.meta.env.VITE_API_URL;

// ----- Helpers ------------------------------------------

function getAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function estMajeur(age) {
  return age !== null && age >= 18;
}

function coursDisponible(cours, age) {
  if (age === null) return true;
  if (cours.ageMin !== null && age < cours.ageMin) return false;
  if (cours.ageMax !== null && age > cours.ageMax) return false;
  // Cours particuliers 45min nécessitent >= 12 ans
  if (cours.id && cours.id.startsWith("cp_45") && age < 12) return false;
  // 30min+FM >= 16 ans
  if (cours.id === "cp_30min_fm" && age < 16) return false;
  return true;
}

function calculerTarif(cours, age, estDuoPartenaire, paiementType) {
  if (!cours || age === null) return null;
  const majeur = estMajeur(age);
  const tarifs = majeur ? cours.tarifs?.majeur : cours.tarifs?.mineur;
  if (!tarifs) return null;
  return paiementType === "annuel" ? tarifs.annuel : tarifs.trimestre;
}

function calculerTotal(eleves, paiementType, nbFoyerTotal) {
  // Pour chaque élève, calculer la somme des cours
  // Règles de réduction :
  // - 10% par activité si membre d'un même foyer (nbFoyerTotal >= 2)
  // - 33% sur chaque discipline à partir de la 2e, sauf yoga et chorale
  // - Non-cumul : seule la réduction la plus avantageuse
  
  let totalGeneral = 0;
  const details = eleves.map((eleve) => {
    const age = getAge(eleve.dateNaissance);
    const majeur = estMajeur(age);
    
    // Trier les cours: le plus cher d'abord pour maximiser la réduction 33% sur les suivants
    const coursAvecPrix = eleve.coursChoisis.map((c) => {
      const prix = calculerTarif(c.coursData, age, false, paiementType);
      return { ...c, prix: prix || 0 };
    }).sort((a, b) => b.prix - a.prix);

    let totalEleve = 0;
    let disciplineCount = 0; // compte les disciplines éligibles 33%

    const coursDetails = coursAvecPrix.map((c, idx) => {
      const prixBase = c.prix;
      let prixFinal = prixBase;
      let reductionAppliquee = null;

      const eligible33 = !c.coursData.yogaChorale;
      
      if (eligible33) {
        disciplineCount++;
        if (disciplineCount >= 2) {
          // 33% de réduction
          const reduc33 = Math.round(prixBase * 0.33);
          // 10% foyer
          const reduc10 = nbFoyerTotal >= 2 ? Math.round(prixBase * 0.10) : 0;
          // On applique la plus avantageuse
          if (reduc33 >= reduc10) {
            prixFinal = prixBase - reduc33;
            reductionAppliquee = "33%";
          } else {
            prixFinal = prixBase - reduc10;
            reductionAppliquee = "10% foyer";
          }
        } else if (nbFoyerTotal >= 2) {
          // 10% foyer sur la 1ère discipline aussi
          const reduc10 = Math.round(prixBase * 0.10);
          prixFinal = prixBase - reduc10;
          reductionAppliquee = "10% foyer";
        }
      } else {
        // Yoga/Chorale : seulement 10% foyer si applicable
        if (nbFoyerTotal >= 2) {
          const reduc10 = Math.round(prixBase * 0.10);
          prixFinal = prixBase - reduc10;
          reductionAppliquee = "10% foyer";
        }
      }

      totalEleve += prixFinal;
      // Supplément matériel arts plastiques
      if (c.coursData.supplementMateriel) {
        totalEleve += c.coursData.supplementMateriel;
      }
      
      return { ...c, prixBase, prixFinal, reductionAppliquee };
    });

    totalEleve += 25; // cotisation annuelle
    totalGeneral += totalEleve;

    return { ...eleve, coursDetails, totalEleve };
  });

  return { details, totalGeneral };
}

// --- Composant principal ------------------------------------------------

export default function InscriptionForm() {
  const [tarifs, setTarifs] = useState(null);
  const [etape, setEtape] = useState("foyer"); // foyer | eleves | recap | confirmation
  
  // Foyer
  const [nbMembres, setNbMembres] = useState(1);
  const [paiementType, setPaiementType] = useState("annuel"); // annuel | trimestre
  
  // Élèves
  const [eleves, setEleves] = useState([]);
  const [eleveActif, setEleveActif] = useState(0);
  
  // Sélection cours pour l'élève actif
  const [selectionEnCours, setSelectionEnCours] = useState(null); // { type: 'cp'|'pc', coursId, instrumentId? }
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  // Engagements
  const [engagements, setEngagements] = useState({
    whatsapp: false,
    assurance: false,
    mineurs: false,
    responsabilite: false,
    absences: false,
    paiement: false,
    reglement: false,
    droitImage: null, // oui | non
  });

  useEffect(() => {
    fetch(`${API}/api/tarifs`)
      .then((r) => r.json())
      .then(setTarifs)
      .catch(() => console.error("Impossible de charger les tarifs"));
  }, []);

  // Init élèves quand on valide le nombre
  const initEleves = () => {
    const newEleves = Array.from({ length: nbMembres }, (_, i) => ({
      id: i,
      nom: "",
      prenom: "",
      dateNaissance: "",
      sexe: "",
      adresse: "",
      codePostal: "",
      localite: "",
      niveauScolaire: "",
      etablissement: "",
      profession: "",
      telPerso: "",
      tel2: "",
      email: "",
      representantNom: "",
      representantPrenom: "",
      parenté: "",
      coursChoisis: [],
    }));
    setEleves(newEleves);
    setEleveActif(0);
    setEtape("eleves");
  };

  const updateEleve = (idx, field, value) => {
    setEleves((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const ajouterCours = (coursData, instrumentId = null) => {
    const newCours = { coursData, instrumentId, id: Date.now() };
    setEleves((prev) =>
      prev.map((e, i) =>
        i === eleveActif
          ? { ...e, coursChoisis: [...e.coursChoisis, newCours] }
          : e
      )
    );
    setPanneauOuvert(false);
    setSelectionEnCours(null);
  };

  const supprimerCours = (eleveIdx, coursId) => {
    setEleves((prev) =>
      prev.map((e, i) =>
        i === eleveIdx
          ? { ...e, coursChoisis: e.coursChoisis.filter((c) => c.id !== coursId) }
          : e
      )
    );
  };

  const soumettre = async () => {
    const { details, totalGeneral } = calculerTotal(eleves, paiementType, eleves.length);
    try {
      const res = await fetch(`${API}/api/inscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foyer: { nbMembres, paiementType },
          eleves: details,
          engagements,
          totalGeneral,
          dateInscription: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setEtape("confirmation");
      } else {
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  if (!tarifs) {
    return (
      <div className="inscr-layout">
        <Header />
        <main className="inscr-loading">
          <div className="inscr-spinner" />
          <p>Chargement du formulaire…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const eleveCourant = eleves[eleveActif] || null;
  const ageCourant = eleveCourant ? getAge(eleveCourant.dateNaissance) : null;
  const { details: elevesAvecTotal, totalGeneral } =
    etape === "recap" || etape === "confirmation"
      ? calculerTotal(eleves, paiementType, eleves.length)
      : { details: [], totalGeneral: 0 };

  return (
    <div className="inscr-layout">
      <Header />

      <section className="inscr-hero">
        <h1>Inscription 2025–2026</h1>
        <p>École des Arts et Musique du Haut-Bugey</p>
      </section>

      <main className="inscr-main">

        {/* -- Étape 1 : Foyer -- */}
        {etape === "foyer" && (
          <div className="inscr-step inscr-step-foyer animate-in">
            <h2>Combien de personnes s'inscrivent ?</h2>
            <p className="inscr-hint">Si plusieurs membres d'un même foyer s'inscrivent, une réduction de 10% par activité s'applique.</p>

            <div className="foyer-nb-selector">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`foyer-nb-btn ${nbMembres === n ? "active" : ""}`}
                  onClick={() => setNbMembres(n)}
                >
                  {n} {n === 1 ? "personne" : "personnes"}
                </button>
              ))}
            </div>

            <div className="paiement-selector">
              <h3>Mode de paiement</h3>
              <div className="paiement-btns">
                <button
                  className={`paiement-btn ${paiementType === "annuel" ? "active" : ""}`}
                  onClick={() => setPaiementType("annuel")}
                >
                  💳 Annuel
                  <span>Tarif plein à l'année</span>
                </button>
                <button
                  className={`paiement-btn ${paiementType === "trimestre" ? "active" : ""}`}
                  onClick={() => setPaiementType("trimestre")}
                >
                  📅 Par trimestre
                  <span>Paiement par trimestre</span>
                </button>
              </div>
            </div>

            <button className="inscr-btn-next" onClick={initEleves}>
              Continuer →
            </button>
          </div>
        )}

        {/* -- Étape 2 : Élèves -- */}
        {etape === "eleves" && eleveCourant && (
          <div className="inscr-step inscr-step-eleves animate-in">

            {/* Onglets élèves */}
            {eleves.length > 1 && (
              <div className="eleve-tabs">
                {eleves.map((e, i) => (
                  <button
                    key={i}
                    className={`eleve-tab ${eleveActif === i ? "active" : ""}`}
                    onClick={() => { setEleveActif(i); setPanneauOuvert(false); }}
                  >
                    {e.prenom || `Élève ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="eleve-content">
              {/* Infos personnelles */}
              <section className="eleve-section">
                <h3>Informations de l'élève {eleves.length > 1 ? `(${eleveActif + 1}/${eleves.length})` : ""}</h3>
                <div className="form-grid">
                  <div className="field">
                    <label>Nom *</label>
                    <input value={eleveCourant.nom} onChange={(e) => updateEleve(eleveActif, "nom", e.target.value)} placeholder="Dupont" />
                  </div>
                  <div className="field">
                    <label>Prénom(s) *</label>
                    <input value={eleveCourant.prenom} onChange={(e) => updateEleve(eleveActif, "prenom", e.target.value)} placeholder="Marie" />
                  </div>
                  <div className="field">
                    <label>Date de naissance *</label>
                    <input type="date" value={eleveCourant.dateNaissance} onChange={(e) => updateEleve(eleveActif, "dateNaissance", e.target.value)} />
                    {ageCourant !== null && (
                      <span className="age-badge">{ageCourant} ans — {estMajeur(ageCourant) ? "Majeur" : "Mineur"}</span>
                    )}
                  </div>
                  <div className="field field-sexe">
                    <label>Sexe</label>
                    <div className="sexe-btns">
                      {["F", "M"].map((s) => (
                        <button key={s} className={`sexe-btn ${eleveCourant.sexe === s ? "active" : ""}`}
                          onClick={() => updateEleve(eleveActif, "sexe", s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="field field-full">
                    <label>Adresse</label>
                    <input value={eleveCourant.adresse} onChange={(e) => updateEleve(eleveActif, "adresse", e.target.value)} placeholder="31 rue des Lilas" />
                  </div>
                  <div className="field">
                    <label>Code postal</label>
                    <input value={eleveCourant.codePostal} onChange={(e) => updateEleve(eleveActif, "codePostal", e.target.value)} placeholder="01130" />
                  </div>
                  <div className="field">
                    <label>Localité</label>
                    <input value={eleveCourant.localite} onChange={(e) => updateEleve(eleveActif, "localite", e.target.value)} placeholder="Nantua" />
                  </div>
                  <div className="field">
                    <label>Téléphone 1 *</label>
                    <input value={eleveCourant.telPerso} onChange={(e) => updateEleve(eleveActif, "telPerso", e.target.value)} placeholder="06 12 34 56 78" />
                  </div>
                  <div className="field">
                    <label>Téléphone 2</label>
                    <input value={eleveCourant.tel2} onChange={(e) => updateEleve(eleveActif, "tel2", e.target.value)} />
                  </div>
                  <div className="field field-full">
                    <label>Email *</label>
                    <input type="email" value={eleveCourant.email} onChange={(e) => updateEleve(eleveActif, "email", e.target.value)} placeholder="marie.dupont@email.fr" />
                  </div>

                  {/* Niveau scolaire ou profession */}
                  {ageCourant !== null && ageCourant < 18 ? (
                    <>
                      <div className="field">
                        <label>Niveau scolaire</label>
                        <input value={eleveCourant.niveauScolaire} onChange={(e) => updateEleve(eleveActif, "niveauScolaire", e.target.value)} placeholder="CM2, 3ème…" />
                      </div>
                      <div className="field">
                        <label>Établissement scolaire</label>
                        <input value={eleveCourant.etablissement} onChange={(e) => updateEleve(eleveActif, "etablissement", e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <div className="field">
                      <label>Profession</label>
                      <input value={eleveCourant.profession} onChange={(e) => updateEleve(eleveActif, "profession", e.target.value)} />
                    </div>
                  )}
                </div>

                {/* Représentant légal si mineur */}
                {ageCourant !== null && ageCourant < 18 && (
                  <div className="representant-block">
                    <h4>Représentant légal</h4>
                    <div className="form-grid">
                      <div className="field">
                        <label>Nom *</label>
                        <input value={eleveCourant.representantNom} onChange={(e) => updateEleve(eleveActif, "representantNom", e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Prénom(s) *</label>
                        <input value={eleveCourant.representantPrenom} onChange={(e) => updateEleve(eleveActif, "representantPrenom", e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Parenté</label>
                        <input value={eleveCourant.parenté} onChange={(e) => updateEleve(eleveActif, "parenté", e.target.value)} placeholder="Mère, Père, Tuteur…" />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Choix des activités */}
              <section className="eleve-section">
                <h3>Activités choisies</h3>

                {ageCourant === null && (
                  <p className="inscr-hint">⚠️ Renseignez la date de naissance pour voir les cours disponibles.</p>
                )}

                {/* Cours déjà sélectionnés */}
                {eleveCourant.coursChoisis.length > 0 && (
                  <div className="cours-selectionnes">
                    {eleveCourant.coursChoisis.map((c) => {
                      const age = getAge(eleveCourant.dateNaissance);
                      const majeur = estMajeur(age);
                      const tarif = calculerTarif(c.coursData, age, false, paiementType);
                      const instrument = c.instrumentId
                        ? tarifs.instruments.find((i) => i.id === c.instrumentId)
                        : null;
                      return (
                        <div key={c.id} className="cours-badge">
                          <span className="cours-badge-label">
                            {instrument && <span>{instrument.emoji} {instrument.label} — </span>}
                            {c.coursData.label}
                          </span>
                          {tarif && <span className="cours-badge-prix">{tarif} €</span>}
                          <button className="cours-badge-del" onClick={() => supprimerCours(eleveActif, c.id)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bouton ajouter un cours */}
                {ageCourant !== null && (
                  <button
                    className="btn-ajouter-cours"
                    onClick={() => { setPanneauOuvert(true); setSelectionEnCours(null); }}
                  >
                    ＋ Ajouter une activité
                  </button>
                )}
              </section>

              {/* Navigation entre élèves */}
              <div className="eleve-nav">
                {eleveActif > 0 && (
                  <button className="inscr-btn-prev" onClick={() => setEleveActif(eleveActif - 1)}>
                    ← Élève précédent
                  </button>
                )}
                {eleveActif < eleves.length - 1 ? (
                  <button
                    className="inscr-btn-next"
                    onClick={() => setEleveActif(eleveActif + 1)}
                  >
                    Élève suivant →
                  </button>
                ) : (
                  <button
                    className="inscr-btn-next"
                    onClick={() => setEtape("recap")}
                    disabled={eleves.some((e) => !e.nom || !e.prenom || !e.dateNaissance || !e.email || !e.telPerso)}
                  >
                    Récapitulatif →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -- Étape 3 : Récapitulatif -- */}
        {etape === "recap" && (
          <div className="inscr-step inscr-step-recap animate-in">
            <h2>Récapitulatif de l'inscription</h2>

            {elevesAvecTotal.map((eleve, idx) => (
              <div key={idx} className="recap-eleve">
                <h3>{eleve.prenom} {eleve.nom}</h3>
                <p className="recap-meta">
                  Né(e) le {eleve.dateNaissance} · {getAge(eleve.dateNaissance)} ans · {estMajeur(getAge(eleve.dateNaissance)) ? "Majeur" : "Mineur"}
                </p>

                <table className="recap-table">
                  <thead>
                    <tr>
                      <th>Activité</th>
                      <th>Tarif de base</th>
                      <th>Réduction</th>
                      <th>Prix final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eleve.coursDetails.map((c, i) => {
                      const instr = c.instrumentId
                        ? tarifs.instruments.find((ins) => ins.id === c.instrumentId)
                        : null;
                      return (
                        <tr key={i}>
                          <td>
                            {instr && <span>{instr.emoji} </span>}
                            {instr ? `${instr.label} — ` : ""}{c.coursData.label}
                            {c.coursData.supplementMateriel && <span className="sup-tag"> +{c.coursData.supplementMateriel}€ mat.</span>}
                          </td>
                          <td>{c.prixBase} €</td>
                          <td>{c.reductionAppliquee || "—"}</td>
                          <td className="prix-final">{c.prixFinal + (c.coursData.supplementMateriel || 0)} €</td>
                        </tr>
                      );
                    })}
                    <tr className="recap-cotisation">
                      <td colSpan="3">Cotisation annuelle</td>
                      <td className="prix-final">25 €</td>
                    </tr>
                    <tr className="recap-sous-total">
                      <td colSpan="3"><strong>Sous-total {eleve.prenom}</strong></td>
                      <td className="prix-final"><strong>{eleve.totalEleve} €</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            <div className="recap-total">
              <span>Total {paiementType === "annuel" ? "annuel" : "par trimestre"}</span>
              <span className="total-montant">{totalGeneral} €</span>
            </div>

            {/* Engagements */}
            <section className="engagements-section">
              <h3>Déclarations et engagements</h3>

              <div className="droit-image">
                <p><strong>Droits à l'image :</strong> Autorisez-vous l'École à photographier ou filmer votre enfant / vous-même, et à utiliser ces images sur ses supports de communication ?</p>
                <div className="oui-non-btns">
                  <button className={engagements.droitImage === "oui" ? "active" : ""} onClick={() => setEngagements({ ...engagements, droitImage: "oui" })}>✓ Oui</button>
                  <button className={engagements.droitImage === "non" ? "active" : ""} onClick={() => setEngagements({ ...engagements, droitImage: "non" })}>✗ Non</button>
                </div>
              </div>

              {[
                { key: "whatsapp", label: "J'autorise l'école à intégrer mon numéro dans un groupe WhatsApp dédié à la communication." },
                { key: "assurance", label: "Je certifie que mon enfant ou moi-même sommes couverts par une assurance responsabilité civile." },
                { key: "mineurs", label: "Pour les élèves mineurs : je m'engage à respecter les horaires et à assurer la présence du professeur avant dépôt." },
                { key: "responsabilite", label: "Je dégage l'établissement de toute responsabilité en dehors des heures de cours." },
                { key: "absences", label: "Je m'engage à prévenir l'enseignant à l'avance de toute absence." },
                { key: "paiement", label: "Je m'engage à régler la totalité de la facture selon les modalités choisies." },
                { key: "reglement", label: "J'atteste avoir pris connaissance du règlement intérieur et j'accepte que l'inscription constitue un engagement annuel non remboursable, sauf cas de force majeure." },
              ].map(({ key, label }) => (
                <label key={key} className="engagement-item">
                  <input
                    type="checkbox"
                    checked={engagements[key]}
                    onChange={(e) => setEngagements({ ...engagements, [key]: e.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </section>

            <div className="recap-nav">
              <button className="inscr-btn-prev" onClick={() => setEtape("eleves")}>← Modifier</button>
              <button
                className="inscr-btn-submit"
                onClick={soumettre}
                disabled={
                  !Object.entries(engagements).every(([k, v]) => k === "droitImage" ? v !== null : v === true)
                }
              >
                Envoyer l'inscription ✓
              </button>
            </div>
          </div>
        )}

        {/* -- Étape 4 : Confirmation -- */}
        {etape === "confirmation" && (
          <div className="inscr-step inscr-step-confirm animate-in">
            <div className="confirm-icon">✓</div>
            <h2>Inscription envoyée !</h2>
            <p>Votre dossier d'inscription a bien été reçu. L'école vous contactera pour finaliser les horaires avec les professeurs.</p>
            <p className="confirm-contact">
              Des questions ? <strong>04 74 75 00 81</strong> · <a href="mailto:ecole@artsmusique-hb.fr">ecole@artsmusique-hb.fr</a>
            </p>
          </div>
        )}
      </main>

      {/* -- Panneau de sélection de cours -- */}
      {panneauOuvert && (
        <div className="panneau-overlay" onClick={() => { setPanneauOuvert(false); setSelectionEnCours(null); }}>
          <div className="panneau-cours" onClick={(e) => e.stopPropagation()}>
            <button className="panneau-close" onClick={() => { setPanneauOuvert(false); setSelectionEnCours(null); }}>✕</button>

            {!selectionEnCours && (
              <ChoixCategorie
                tarifs={tarifs}
                age={ageCourant}
                coursDejaChoisis={eleveCourant.coursChoisis}
                onSelectCP={(cours) => setSelectionEnCours({ type: "cp", cours })}
                onSelectPC={(cours) => ajouterCours(cours)}
              />
            )}

            {selectionEnCours?.type === "cp" && (
              <ChoixInstrument
                tarifs={tarifs}
                cours={selectionEnCours.cours}
                age={ageCourant}
                onSelect={(instrumentId) => ajouterCours(selectionEnCours.cours, instrumentId)}
                onBack={() => setSelectionEnCours(null)}
              />
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// --- Sous-composants ------------------------------------------------

function ChoixCategorie({ tarifs, age, coursDejaChoisis, onSelectCP, onSelectPC }) {
  const [tab, setTab] = useState("cp");
  const dejaChoisisIds = coursDejaChoisis.map((c) => c.coursData.id + (c.instrumentId || ""));

  const cpDispos = tarifs.coursParticuliers.filter((c) => coursDisponible(c, age));
  const pcDispos = tarifs.pratiquesCollectives.filter((c) => coursDisponible(c, age));

  return (
    <div className="choix-container">
      <h3>Ajouter une activité</h3>
      <p className="panneau-age">Âge : {age} ans — {estMajeur(age) ? "Majeur (+18 ans)" : "Mineur (-18 ans)"}</p>

      <div className="cours-tabs">
        <button className={`cours-tab ${tab === "cp" ? "active" : ""}`} onClick={() => setTab("cp")}>
          🎵 Cours particuliers
        </button>
        <button className={`cours-tab ${tab === "pc" ? "active" : ""}`} onClick={() => setTab("pc")}>
          🎭 Pratiques collectives
        </button>
      </div>

      {tab === "cp" && (
        <div className="cours-liste">
          {cpDispos.length === 0 && <p className="inscr-hint">Aucun cours particulier disponible pour cet âge.</p>}
          {cpDispos.map((c) => {
            const majeur = estMajeur(age);
            const tarif = majeur ? c.tarifs.majeur : c.tarifs.mineur;
            return (
              <button key={c.id} className="cours-choice-card" onClick={() => onSelectCP(c)}>
                <div className="ccc-top">
                  <strong>{c.label}</strong>
                  {c.duo && <span className="tag-duo">DUO</span>}
                  {c.inclusFM && <span className="tag-fm">+ FM/Orchestre inclus</span>}
                </div>
                {tarif && (
                  <div className="ccc-prix">
                    {tarif.trimestre} €/trimestre · {tarif.annuel} €/an
                    {c.noteParEleve && <span> (par élève)</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === "pc" && (
        <div className="cours-liste">
          {pcDispos.length === 0 && <p className="inscr-hint">Aucune pratique collective disponible pour cet âge.</p>}
          {pcDispos.map((c) => {
            const majeur = estMajeur(age);
            const tarif = majeur ? c.tarifs.majeur : c.tarifs.mineur;
            const dejaChoisi = coursDejaChoisis.some((cc) => cc.coursData.id === c.id);
            return (
              <button
                key={c.id}
                className={`cours-choice-card ${dejaChoisi ? "deja-choisi" : ""}`}
                onClick={() => !dejaChoisi && onSelectPC(c)}
                disabled={dejaChoisi}
              >
                <div className="ccc-top">
                  <strong>{c.label}</strong>
                  <span className="tag-duree">{c.duree} min</span>
                  {c.yogaChorale && <span className="tag-yoga">Pas de réduction multi-activités</span>}
                  {c.supplementMateriel && <span className="tag-mat">+{c.supplementMateriel}€ matériel/an</span>}
                </div>
                {tarif ? (
                  <div className="ccc-prix">
                    {tarif.trimestre} €/trimestre · {tarif.annuel} €/an
                  </div>
                ) : (
                  <div className="ccc-prix text-muted">Non disponible pour les majeurs</div>
                )}
                {dejaChoisi && <span className="tag-deja">✓ Déjà sélectionné</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChoixInstrument({ tarifs, cours, age, onSelect, onBack }) {
  const majeur = estMajeur(age);
  const tarif = majeur ? cours.tarifs.majeur : cours.tarifs.mineur;

  return (
    <div className="choix-container">
      <button className="panneau-back" onClick={onBack}>← Retour</button>
      <h3>{cours.label}</h3>
      {tarif && (
        <p className="panneau-prix">
          {tarif.trimestre} €/trimestre · {tarif.annuel} €/an
          {cours.noteParEleve && " (par élève)"}
        </p>
      )}
      {cours.inclusFM && <p className="panneau-fm">✓ Formation Musicale / Orchestre incluse</p>}

      <p className="choix-instr-titre">Choisissez votre instrument :</p>
      <div className="instruments-grid">
        {tarifs.instruments.map((instr) => (
          <button key={instr.id} className="instr-card" onClick={() => onSelect(instr.id)}>
            <span className="instr-emoji">{instr.emoji}</span>
            <span className="instr-label">{instr.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
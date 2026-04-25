import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./InscriptionForm.css";

const API = import.meta.env.VITE_API_URL;

// -------- Définition des tags avec leurs tranches d'âge 
const TAGS_DEF = [
  { id: "eveil_3_5",     label: "Éveil 3–5 ans",     ageMin: 3,  ageMax: 5  },
  { id: "enfant_6_10",   label: "Enfant 6–10 ans",   ageMin: 6,  ageMax: 10 },
  { id: "enfant_7_10",   label: "Enfant 7–10 ans",   ageMin: 7,  ageMax: 10 },
  { id: "enfant_11_15",  label: "Enfant 11–15 ans",  ageMin: 11, ageMax: 15 },
  { id: "enfant_12_15",  label: "Enfant 12–15 ans",  ageMin: 12, ageMax: 15 },
  { id: "ado_16plus",    label: "Ado 16+ ans",        ageMin: 16, ageMax: 17 },
  { id: "adulte",        label: "Adulte 18+ ans",     ageMin: 18, ageMax: null },
];

function getTagsForAge(age) {
  if (age === null) return [];
  return TAGS_DEF.filter((t) => age >= t.ageMin && (t.ageMax === null || age <= t.ageMax)).map((t) => t.id);
}

function coursDisponibleParTags(cours, age) {
  if (age === null) return true;
  if (!cours.tags || cours.tags.length === 0) return true; // pas de tag = dispo pour tous
  const ageTags = getTagsForAge(age);
  return cours.tags.some((t) => ageTags.includes(t));
}

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

function calculerTarif(cours, age, paiementType) {
  if (!cours || age === null) return null;
  const t = estMajeur(age) ? cours.tarifs?.majeur : cours.tarifs?.mineur;
  if (!t) return null;
  return paiementType === "annuel" ? t.annuel : t.trimestre;
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
    const coursAvecPrix = (eleve.coursChoisis || [])
      .map((c) => ({ ...c, prix: calculerTarif(c.coursData, age, paiementType) || 0 }))
      .sort((a, b) => b.prix - a.prix);

    let totalEleve = 0;
    let disciplineCount = 0; // compte les disciplines éligibles 33%

    const coursDetails = coursAvecPrix.map((c) => {
      const prixBase = c.prix;
      let prixFinal = prixBase;
      let reductionAppliquee = null;

      const eligible33 = !c.coursData.yogaChorale;
      
      if (eligible33) {
        disciplineCount++;
        if (disciplineCount >= 2) {
          // 33% de réduction
          const reduc33 = (prixBase * 0.33);
          // 10% foyer
          const reduc10 = nbFoyerTotal >= 2 ?  (prixBase * 0.10) : 0;
          // On applique la plus avantageuse
          if (reduc33 >= reduc10) { 
            prixFinal = prixBase - reduc33;
            reductionAppliquee = "−33%"; 
          } else { 
            prixFinal = prixBase - reduc10; 
            reductionAppliquee = "−10% foyer"; 
          }
        } else if (nbFoyerTotal >= 2) {
          // 10% foyer sur la 1ère discipline aussi
          const reduc10 = (prixBase * 0.10);
          prixFinal = prixBase - reduc10;
          reductionAppliquee = "−10% foyer";
        }
      } else if (nbFoyerTotal >= 2) {
        // Yoga/Chorale : seulement 10% foyer si applicable
        const reduc10 = (prixBase * 0.10);
        prixFinal = prixBase - reduc10;
        reductionAppliquee = "−10% foyer";
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

function genId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// --- Composant principal ------------------------------------------------

export default function InscriptionForm() {
  const [tarifs, setTarifs] = useState(null);
  const [etape, setEtape] = useState("accueil"); // accueil | foyer | eleves | recap | confirmation
  
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
    droitImage: null, // oui / non / null = non rep
  });

  // Récupération
  const [codeRecherche, setCodeRecherche] = useState("");
  const [inscriptionTrouvee, setInscriptionTrouvee] = useState(null);
  const [rechercheErreur, setRechercheErreur] = useState("");
  const [rechercheLoading, setRechercheLoading] = useState(false);

  // ID de l'inscription en cours d'édition
  const [inscriptionId, setInscriptionId] = useState(null);
  const [inscriptionCode, setInscriptionCode] = useState(null);

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

  const updateEleve = (idx, field, value) =>
    setEleves((prev) => 
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
);

  const ajouterCours = (coursData, instrumentId = null) => {
    setEleves((prev) => 
      prev.map((e, i) =>
      i === eleveActif 
          ? { ...e, coursChoisis: [...e.coursChoisis, { coursData, instrumentId, id: Date.now() }] }
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

    // Si on modifie une inscription existante → PUT, sinon POST avec nouveau code
    const isModification = !!inscriptionId;
    const code = inscriptionCode || genId();

    const payload = {
      code,
      foyer: { nbMembres, paiementType },
      eleves: details,
      engagements,
      totalGeneral,
      statut: "en_attente",
      dateInscription: new Date().toISOString(),
    };

    try {
      const res = await fetch(
        isModification
          ? `${API}/api/inscriptions/${inscriptionId}`
          : `${API}/api/inscriptions`,
        {
          method: isModification ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 403) {
        // L'inscription a été validée entre-temps
        alert("Cette inscription a été validée par le bureau. Toute modification doit se faire directement à l'école.");
        return;
      }

      if (res.ok) {
        const data = isModification ? { id: inscriptionId } : await res.json();
        setInscriptionCode(code);
        setInscriptionId(isModification ? inscriptionId : data.id);
        setEtape("confirmation");
      } else {
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const rechercherInscription = async () => {
    if (!codeRecherche.trim()) return;
    setRechercheLoading(true);
    setRechercheErreur("");
    setInscriptionTrouvee(null);
    try {
      const res = await fetch(`${API}/api/inscriptions/code/${codeRecherche.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setInscriptionTrouvee(data);
      } else {
        setRechercheErreur("Aucune inscription trouvée avec ce code. Vérifiez la saisie.");
      }
    } catch { setRechercheErreur("Erreur réseau. Réessayez."); }
    setRechercheLoading(false);
  };

  const reprendreInscription = (ins) => {
    setNbMembres(ins.foyer?.nbMembres || 1);
    setPaiementType(ins.foyer?.paiementType || "annuel");
    setEleves(ins.eleves || []);
    setEngagements(ins.engagements || { whatsapp: false, assurance: false, mineurs: false, responsabilite: false, absences: false, paiement: false, reglement: false, droitImage: null });
    setInscriptionId(ins.id);
    setInscriptionCode(ins.code);
    setEleveActif(0);
    setEtape("eleves");
    setInscriptionTrouvee(null);
  };

  if (!tarifs) return (
    <div className="inscr-layout"><Header />
      <main className="inscr-loading"><div className="inscr-spinner" /><p>Chargement du formulaire…</p></main>
      <Footer />
    </div>
  );


  const basculerTout = () => {
              const tousCoches = Object.entries(engagements)
                .filter(([key]) => key !== "droitImage")
                .every(([_, v]) => v === true);

              const nouvelleValeur = !tousCoches; // Si tout est coché, on met false, sinon true.

              setEngagements(prev => ({
                ...prev,
                whatsapp: nouvelleValeur,
                assurance: nouvelleValeur,
                mineurs: nouvelleValeur,
                responsabilite: nouvelleValeur,
                absences: nouvelleValeur,
                paiement: nouvelleValeur,
                reglement: nouvelleValeur,
              }));
            };

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

        {/* -- Étape 0 : Accueil : nouvelle ou reprise */}
        {etape === "accueil" && (
          <div className="inscr-step animate-in">
            <div className="accueil-choix">
              <div className="accueil-choix-card" onClick={() => setEtape("foyer")}>
                <div className="acc-icon">📝</div>
                <h3>Nouvelle inscription</h3>
                <p>Inscrire un ou plusieurs membres du foyer pour 2025–2026</p>
              </div>
              <div className="accueil-choix-card" onClick={() => setEtape("recherche")}>
                <div className="acc-icon">🔍</div>
                <h3>Retrouver mon inscription</h3>
                <p>Modifier ou consulter une inscription existante avec mon code</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Recherche par code ── */}
        {etape === "recherche" && (
          <div className="inscr-step animate-in">
            <h2>Retrouver mon inscription</h2>
            <p className="inscr-hint">Entrez le code à 8 caractères reçu lors de votre inscription.</p>
            <div className="code-search-row">
              <input
                className="code-input"
                placeholder="Ex : AB3K7P2X"
                value={codeRecherche}
                onChange={(e) => setCodeRecherche(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && rechercherInscription()}
                maxLength={8}
              />
              <button className="inscr-btn-next" style={{ margin: 0 }} onClick={rechercherInscription} disabled={rechercheLoading}>
                {rechercheLoading ? "…" : "Rechercher"}
              </button>
            </div>
            {rechercheErreur && <p className="inscr-error">{rechercheErreur}</p>}

            {inscriptionTrouvee && (
              <div className="ins-trouvee-card">
                {inscriptionTrouvee.statut === "valide" ? (
                  <div className="ins-valide-box">
                    <div className="ins-valide-icon">✅</div>
                    <h3>Inscription validée par le bureau</h3>
                    <p>Votre dossier a été traité. Pour toute modification, merci de vous présenter directement au bureau de l'école.</p>
                    <p><strong>Montant à régler :</strong> {inscriptionTrouvee.totalGeneral} €</p>
                    <p className="ins-contact">📞 04 74 75 00 81 · <a href="mailto:ecole@artsmusique-hb.fr">ecole@artsmusique-hb.fr</a></p>
                  </div>
                ) : (
                  <div>
                    <h3>Inscription trouvée ✓</h3>
                    <p>{inscriptionTrouvee.eleves?.map((e) => `${e.prenom} ${e.nom}`).join(", ")}</p>
                    <p>Enregistrée le {new Date(inscriptionTrouvee.dateInscription).toLocaleDateString("fr-FR")} · {inscriptionTrouvee.totalGeneral} €</p>
                    <p className="inscr-hint">Cette inscription est encore modifiable.</p>
                    <div className="ins-trouvee-btns">
                      <button className="inscr-btn-next" onClick={() => reprendreInscription(inscriptionTrouvee)}>✏️ Modifier l'inscription</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="inscr-btn-prev" style={{ marginTop: "1.5rem" }} onClick={() => { setEtape("accueil"); setRechercheErreur(""); setInscriptionTrouvee(null); setCodeRecherche(""); }}>
              ← Retour
            </button>
          </div>
        )}

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
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="inscr-btn-prev" onClick={() => setEtape("accueil")}>← Retour</button>
              <button className="inscr-btn-next" onClick={initEleves}>Continuer →</button>
            </div>
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
                      {["F", "M", "Autre"].map((s) => (
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
                {ageCourant === null && <p className="inscr-hint">⚠️ Renseignez d'abord la date de naissance pour voir les cours disponibles.</p>}
                {/* Cours déjà sélectionnés */}
                {eleveCourant.coursChoisis.length > 0 && (
                  <div className="cours-selectionnes">
                    {eleveCourant.coursChoisis.map((c) => {
                      const tarif = calculerTarif(c.coursData, ageCourant, paiementType);
                      const instr = c.instrumentId ? tarifs.instruments.find((i) => i.id === c.instrumentId) : null;
                      return (
                        <div key={c.id} className="cours-badge">
                          <span className="cours-badge-label">
                            {instr && <span>{instr.emoji} {instr.label} — </span>}
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
                {eleveActif > 0 && <button className="inscr-btn-prev" onClick={() => setEleveActif(eleveActif - 1)}>← Élève précédent</button>}
                {eleveActif < eleves.length - 1 ? (
                  <button className="inscr-btn-next" onClick={() => setEleveActif(eleveActif + 1)}>Élève suivant →</button>
                ) : (
                  <button className="inscr-btn-next" onClick={() => setEtape("recap")}
                    disabled={eleves.some((e) => !e.nom || !e.prenom || !e.dateNaissance || !e.email || !e.telPerso)}>
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
                <p className="recap-meta">Né(e) le {eleve.dateNaissance} · {getAge(eleve.dateNaissance)} ans · {estMajeur(getAge(eleve.dateNaissance)) ? "Majeur" : "Mineur"}</p>
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
                      const instr = c.instrumentId ? tarifs.instruments.find((ins) => ins.id === c.instrumentId) : null;
                      return (
                        <tr key={i}>
                          <td>{instr && <span>{instr.emoji} </span>}{instr ? `${instr.label} — ` : ""}{c.coursData.label}{c.coursData.supplementMateriel && <span className="sup-tag"> +{c.coursData.supplementMateriel}€ mat.</span>}</td>
                          <td>{typeof c.prixBase === "number" ? c.prixBase.toFixed(2) : c.prixBase} €</td>
                          <td>{c.reductionAppliquee || "—"}</td>
                          <td className="prix-final">
                            {typeof c.prixFinal === "number"
                              ? (c.prixFinal + (c.coursData.supplementMateriel || 0)).toFixed(2)
                              : c.prixFinal} €
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="recap-cotisation"><td colSpan="3">Cotisation annuelle</td><td className="prix-final">25 €</td></tr>
                    <tr className="recap-sous-total"><td colSpan="3"><strong>Sous-total {eleve.prenom}</strong></td><td className="prix-final"><strong>{eleve.totalEleve} €</strong></td></tr>
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
              {/* 1. Le Header avec Titre + Bouton Bascule */}
              <div className="engagements-header">
                <h3>Déclarations et engagements</h3>
                {(() => {
                  const tousCoches = Object.entries(engagements)
                    .filter(([key]) => key !== "droitImage")
                    .every(([_, v]) => v === true);

                  return (
                    <button 
                      type="button" 
                      className={`inscr-btn-tout-cocher ${tousCoches ? 'active' : ''}`}
                      onClick={basculerTout}
                    >
                      {tousCoches ? "❌ Tout décocher" : "✅ Tout cocher"}
                    </button>
                  );
                })()}
              </div>

              {/* 2. Le Droit à l'image (Exclu du "Tout cocher") */}
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
              <button className="inscr-btn-submit" onClick={soumettre}
                disabled={!Object.entries(engagements).every(([k, v]) => k === "droitImage" ? v !== null : v === true)}>
                Envoyer l'inscription ✓
              </button>
            </div>
          </div>
        )}

        {/* -- Étape 4 : Confirmation -- */}
        {etape === "confirmation" && (
          <div className="inscr-step inscr-step-confirm animate-in">
            <div className="confirm-icon">✓</div>
            <h2>{inscriptionId && inscriptionCode ? "Inscription mise à jour !" : "Inscription envoyée !"}</h2>
            <p>
              {inscriptionId && inscriptionCode
                ? "Vos modifications ont bien été enregistrées."
                : "Votre dossier a bien été reçu. L'école vous recontactera pour finaliser les horaires avec les professeurs."
              }
            </p>

            <div className="confirm-code-box">
              <p className="confirm-code-label">Votre code de dossier</p>
              <div className="confirm-code">{inscriptionCode}</div>
              <p className="confirm-code-hint">
                Conservez ce code — il vous permet de retrouver et modifier votre dossier en ligne, tant qu'il n'a pas été traité par le bureau.
              </p>
            </div>

            <div className="confirm-bureau-box">
              <h3>📍 Prochaine étape : passez au bureau</h3>
              <p>
                Présentez-vous à l'école muni de ce code afin de finaliser votre inscription et régler le montant de <strong>{totalGeneral} €</strong>.
              </p>
              <p className="confirm-modif-note">
                Votre dossier reste <strong>modifiable en ligne</strong> jusqu'à sa prise en charge par l'équipe. Une fois validé, toute modification ultérieure devra se faire directement au bureau de l'école.
              </p>
            </div>

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
                onSelectCP={(c) => setSelectionEnCours({ type: "cp", cours: c })}
                onSelectPC={(c) => ajouterCours(c)}
              />
            )}

            {selectionEnCours?.type === "cp" && (
              <ChoixInstrument 
                tarifs={tarifs} 
                cours={selectionEnCours.cours} 
                age={ageCourant}
                onSelect={(id) => ajouterCours(selectionEnCours.cours, id)}
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
  const cpDispos = tarifs.coursParticuliers.filter((c) => coursDisponibleParTags(c, age));
  const pcDispos = tarifs.pratiquesCollectives.filter((c) => coursDisponibleParTags(c, age));

  return (
    <div className="choix-container">
      <h3>Ajouter une activité</h3>
      <p className="panneau-age">Âge : {age} ans — {estMajeur(age) ? "Majeur (+18 ans)" : "Mineur (-18 ans)"}</p>

      <div className="cours-tabs">
        <button className={`cours-tab ${tab === "cp" ? "active" : ""}`} onClick={() => setTab("cp")}>🎵 Cours particuliers</button>
        <button className={`cours-tab ${tab === "pc" ? "active" : ""}`} onClick={() => setTab("pc")}>🎭 Pratiques collectives</button>
      </div>

      {tab === "cp" && (
        <div className="cours-liste">
          {cpDispos.length === 0 && <p className="inscr-hint">Aucun cours particulier disponible pour cet âge.</p>}
          {cpDispos.map((c) => {
            const tarif = estMajeur(age) ? c.tarifs.majeur : c.tarifs.mineur;
            return (
              <button key={c.id} className="cours-choice-card" onClick={() => onSelectCP(c)}>
                <div className="ccc-top">
                  <strong>{c.label}</strong>
                  {c.duo && <span className="tag-duo">DUO</span>}
                  {c.inclusFM && <span className="tag-fm">+ FM/Orchestre</span>}
                </div>
                {tarif && <div className="ccc-prix">{tarif.trimestre} €/trim · {tarif.annuel} €/an{c.noteParEleve && " (par élève)"}</div>}
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
              <button key={c.id} className={`cours-choice-card ${dejaChoisi ? "deja-choisi" : ""}`}
                onClick={() => !dejaChoisi && onSelectPC(c)} disabled={dejaChoisi}>
                <div className="ccc-top">
                  <strong>{c.label}</strong>
                  <span className="tag-duree">{c.duree} min</span>
                  {c.yogaChorale && <span className="tag-yoga">Pas de réduction multi-activités</span>}
                  {c.supplementMateriel && <span className="tag-mat">+{c.supplementMateriel}€ matériel</span>}
                </div>
                {tarif
                  ? <div className="ccc-prix">{tarif.trimestre} €/trim · {tarif.annuel} €/an</div>
                  : <div className="ccc-prix text-muted">Non disponible pour les majeurs</div>}
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
  const tarif = estMajeur(age) ? cours.tarifs.majeur : cours.tarifs.mineur;
  return (
    <div className="choix-container">
      <button className="panneau-back" onClick={onBack}>← Retour</button>
      <h3>{cours.label}</h3>
      {tarif && <p className="panneau-prix">{tarif.trimestre} €/trimestre · {tarif.annuel} €/an{cours.noteParEleve && " (par élève)"}</p>}
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
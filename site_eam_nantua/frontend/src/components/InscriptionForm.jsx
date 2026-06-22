import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./InscriptionForm.css";
import { FicheInscriptionModal } from "./FicheInscription";

const API = import.meta.env.VITE_API_URL;

function arrondir(val) {
  return Math.round(val);
}

// -------- Définition des tags avec leurs tranches d'âge 
const TAGS_DEF = [
  { id: "eveil_3",     label: "Éveil 3 ans",     ageMin: 3,  ageMax: 4  },
  { id: "eveil_4_5",     label: "Éveil 4–5 ans",     ageMin: 4,  ageMax: 5  },
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

function calculerTotal(eleves, paiementType, nbFoyerTotal, cotisation) {
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
      .sort((a, b) => b.prix - a.prix); // tri décroissant : réduction sur les moins chers

    // Identifier l'activité éligible la moins chère (pour la réduction 1/3)
    const coursEligibles = coursAvecPrix
      .filter(c => !c.coursData.yogaChorale)
      .sort((a, b) => a.prix - b.prix); // tri croissant : la moins chère en premier


    // L'index (dans coursAvecPrix) du cours le moins cher éligible, seulement s'il y en a >= 2
    const idCoursReduit = coursEligibles.length >= 2 ? coursEligibles[0].id : null;
    let totalEleve = 0;
    // let disciplineCount = 0; // compte les disciplines éligibles 33%
    

    const coursDetails = coursAvecPrix.map((c) => {
      const prixBase = c.prix;
      let prixFinal = prixBase;
      let reductionAppliquee = null;

      // const eligible33 = !c.coursData.yogaChorale;
      const est1erEligible = !c.coursData.yogaChorale;
      
      if (c.id === idCoursReduit) {
        // Réduction 1/3 sur la moins chère éligible
        const reduc33 = prixBase / 3;
        const reduc10 = nbFoyerTotal >= 2 ? prixBase * 0.10 : 0;
        if (reduc33 >= reduc10) {
          prixFinal = arrondir(prixBase - reduc33);
          reductionAppliquee = "−33% discipline";
        } else {
          prixFinal = arrondir(prixBase - reduc10);
          reductionAppliquee = "−10% foyer";
        }
      } else if (nbFoyerTotal >= 2 && est1erEligible) {
        // 10% foyer sur les autres activités éligibles
        const reduc10 = prixBase * 0.10;
        prixFinal = arrondir(prixBase - reduc10);
        reductionAppliquee = "−10% foyer";
      } else if (nbFoyerTotal >= 2 && c.coursData.yogaChorale) {
        // Yoga/Chorale : seulement 10% foyer
        const reduc10 = prixBase * 0.10;
        prixFinal = arrondir(prixBase - reduc10);
        reductionAppliquee = "−10% foyer";
      }

      totalEleve += prixFinal;
      return { ...c, prixBase, prixFinal, reductionAppliquee };
    });

    // Supplément matériel séparé et jamais réduit
    let totalSupMateriel = 0;
    coursDetails.forEach(c => {
      if (c.coursData.supplementMateriel) {
        totalSupMateriel += c.coursData.supplementMateriel;
      }
    });

    totalEleve += totalSupMateriel;
    totalEleve += cotisation; // cotisation annuelle // TODO : changer pour mettre dynamique
    totalGeneral += totalEleve;

    return { ...eleve, coursDetails, totalEleve, cotisation};
  });

  return { details, totalGeneral };
}

function genId(eleves = []) {
  // Prend le premier élève pour générer le code
  const eleve = eleves[0];
  let prefix = "";
  
  if (eleve) {
    const nom = (eleve.nom || "").toUpperCase().replace(/[^A-Z]/g, "");
    const prenom = (eleve.prenom || "").toUpperCase().replace(/[^A-Z]/g, "");
    
    if (nom.length >= 4) {
      prefix = nom.substring(0, 4);
    } else if (nom.length >= 3) {
      prefix = nom + prenom.substring(0, 1);
    } else if (nom.length >= 2) {
      prefix = nom + prenom.substring(0, 2);
    } else {
      prefix = (nom + prenom).substring(0, 4);
    }
    // Compléter si trop court
    prefix = prefix.padEnd(4, "X").substring(0, 4);
    
    // Date de naissance : JJMM
    const dob = eleve.dateNaissance || "";
    if (dob && dob.length === 10) {
      const [annee, mois, jour] = dob.split("-");
      prefix += jour + mois;
    } else {
      const chars = "0123456789";
      prefix += Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }
  } else {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    prefix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
  
  return prefix;
}

// --- Composant principal ------------------------------------------------

export default function InscriptionForm() {
  const [tarifs, setTarifs] = useState(null);
  const [etape, setEtape] = useState("accueil"); // accueil | foyer | eleves | recap | confirmation
  const [ficheInscription, setFicheInscription] = useState(null);
  
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
    demission: false,
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

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const editId = params.get('edit');
    const editCode = params.get('code');
    
    if (editId && editCode) {
      fetch(`${API}/api/inscriptions/code/${editCode}`)
        .then(r => r.json())
        .then(ins => {
          if (ins) {
            setNbMembres(ins.foyer?.nbMembres || 1);
            setPaiementType(ins.foyer?.paiementType || "annuel");
            setEleves(ins.eleves || []);
            setEngagements(ins.engagements || { whatsapp:false, assurance:false, mineurs:false, responsabilite:false, absences:false, paiement:false, reglement:false, droitImage:null });
            // Ne pas pré-remplir ni créer de champ `rib` côté client
            setModePaiement(ins.modePaiement || { type:"", nbFois:1 });
            setInscriptionId(ins.id);
            setInscriptionCode(ins.code);
            setEleveActif(0);
            setEtape("eleves");
          }
        })
        .catch(() => {});
    }
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

  const [modePaiement, setModePaiement] = useState({
    type: "", // cheque | especes | virement | mandat_sepa
    nbFois: 1,
    // rib: "", // pour mandat SEPA (désactivé)
  })

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
    const { details, totalGeneral: totalBase } = calculerTotal(eleves, paiementType, eleves.length, tarifs.cotisationAnnuelle);
    const totalAvecFrais = totalBase + (modePaiement.type === "mandat_sepa" ? 10 : 0);

    // Si on modifie une inscription existante → PUT, sinon POST avec nouveau code
    const isModification = !!inscriptionId;
    const code = inscriptionCode || genId(eleves);

    const payload = {
      code,
      foyer: { nbMembres, paiementType },
      modePaiement,
      eleves: details,
      engagements,
      totalGeneral: totalAvecFrais,
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
        setFicheInscription({ code, foyer: { nbMembres, paiementType }, modePaiement, engagements, eleves: elevesAvecTotal });
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
    setEngagements(ins.engagements || { whatsapp: false, assurance: false, mineurs: false, responsabilite: false, absences: false, paiement: false, reglement: false, droitImage: null, demission: false });
    setInscriptionId(ins.id);
    setInscriptionCode(ins.code);
    setEleveActif(0);
    setEtape("eleves");
    setInscriptionTrouvee(null);
    // Ne pas pré-remplir ni créer de champ `rib` côté client
    setModePaiement(ins.modePaiement || { type: "", nbFois: 1 });
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
      demission: nouvelleValeur,
      reglement: nouvelleValeur,
    }));
  };

  const eleveCourant = eleves[eleveActif] || null;
  const ageCourant = eleveCourant ? getAge(eleveCourant.dateNaissance) : null;
  const { details: elevesAvecTotal, totalGeneral: totalBase } =
    etape === "recap" || etape === "confirmation"
      ? calculerTotal(eleves, paiementType, eleves.length, tarifs.cotisationAnnuelle)
      : { details: [], totalGeneral: 0 };
  
  // Ajouter 10€ de frais si mandat SEPA
  const fraisSepa = modePaiement.type === "mandat_sepa" ? 10 : 0;
  const totalGeneral = totalBase + fraisSepa;

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
            <div style={{textAlign:"center", marginBottom:"1.5rem"}}>
              <button
                className="inscr-btn-prev"
                style={{borderColor:"var(--inscr-primary)", color:"var(--inscr-primary)", fontWeight:700, fontSize:"0.95rem"}}
                onClick={() => setEtape("tarifs")}
              >
                📋 Consulter les cours et tarifs 2025–2026
              </button>
            </div>
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

        {/* ── Grille tarifaire ── */}
        {etape === "tarifs" && tarifs && (
          <div className="inscr-step animate-in">
            <h2>📋 Cours & tarifs 2025–2026</h2>
            <p className="inscr-hint">Cotisation annuelle : <strong>{tarifs.cotisationAnnuelle} €</strong> par élève (non comprise dans les tarifs ci-dessous).</p>
            <p className="inscr-hint">Réductions : <strong>10%</strong> par activité pour les membres d'un même foyer · <strong>1/3</strong> sur chaque discipline à partir de la 2ème (sauf Yoga et Chorale). Non-cumul : la plus avantageuse s'applique.</p>
            
            <h3 style={{marginTop:"1.5rem", color:"var(--inscr-primary)", borderBottom:"2px solid #f3e8ff", paddingBottom:"0.4rem"}}>🎵 Cours particuliers d'instruments</h3>
            <div style={{overflowX:"auto"}}>
              <table className="recap-table" style={{marginBottom:"1.5rem"}}>
                <thead>
                  <tr>
                    <th>Formule</th>
                    <th>Mineur — Trimestre</th>
                    <th>Mineur — Annuel</th>
                    <th>Majeur — Trimestre</th>
                    <th>Majeur — Annuel</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifs.coursParticuliers.map(cp => (
                    <tr key={cp.id}>
                      <td><strong>{cp.label}</strong></td>
                      <td>{cp.tarifs?.mineur?.trimestre} €</td>
                      <td>{cp.tarifs?.mineur?.annuel} €</td>
                      <td>{cp.tarifs?.majeur?.trimestre} €</td>
                      <td>{cp.tarifs?.majeur?.annuel} €</td>
                      <td style={{fontSize:"0.75rem"}}>
                        {cp.duo && <span className="tag-duo">DUO</span>} {cp.inclusFM && <span className="tag-fm">+FM</span>}
                        {cp.noteParEleve && <span style={{color:"#6b7280"}}> /élève</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{marginTop:"1.5rem", color:"var(--inscr-primary)", borderBottom:"2px solid #f3e8ff", paddingBottom:"0.4rem"}}>🎭 Pratiques collectives</h3>
            <div style={{overflowX:"auto"}}>
              <table className="recap-table" style={{marginBottom:"1.5rem"}}>
                <thead>
                  <tr>
                    <th>Activité</th>
                    <th>Durée</th>
                    <th>Mineur — Trimestre</th>
                    <th>Mineur — Annuel</th>
                    <th>Majeur — Trimestre</th>
                    <th>Majeur — Annuel</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifs.pratiquesCollectives.map(pc => (
                    <tr key={pc.id}>
                      <td><strong>{pc.label}</strong></td>
                      <td>{pc.duree} min</td>
                      <td>{pc.tarifs?.mineur?.trimestre} €</td>
                      <td>{pc.tarifs?.mineur?.annuel} €</td>
                      <td>{pc.tarifs?.majeur ? `${pc.tarifs.majeur.trimestre} €` : "—"}</td>
                      <td>{pc.tarifs?.majeur ? `${pc.tarifs.majeur.annuel} €` : "—"}</td>
                      <td style={{fontSize:"0.75rem"}}>
                        {pc.supplementMateriel > 0 && <span className="tag-mat">+{pc.supplementMateriel}€ mat.</span>}
                        {pc.yogaChorale && <span className="tag-yoga">Pas de réduction multi</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tarifs.pdfUrl && (
              <p style={{textAlign:"center", marginBottom:"1rem"}}>
                <a href={tarifs.pdfUrl.startsWith("http") ? tarifs.pdfUrl : `${API}${tarifs.pdfUrl}`}
                   target="_blank" rel="noopener noreferrer"
                   style={{color:"var(--inscr-primary)", fontWeight:700}}>
                  📄 Télécharger la grille tarifaire PDF
                </a>
              </p>
            )}

            <button className="inscr-btn-prev" style={{marginTop:"1rem"}} onClick={() => setEtape("accueil")}>← Retour</button>
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
                    <div className="ins-trouvee-btns" style={{ marginTop: "1rem" }}>
                      <button className="inscr-btn-next" onClick={() => setFicheInscription(inscriptionTrouvee)}>
                        📄 PDF fiche inscription
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3>Inscription trouvée ✓</h3>
                    <p>{inscriptionTrouvee.eleves?.map((e) => `${e.prenom} ${e.nom}`).join(", ")}</p>
                    <p>Enregistrée le {new Date(inscriptionTrouvee.dateInscription).toLocaleDateString("fr-FR")} · {inscriptionTrouvee.totalGeneral} €</p>
                    <p className="inscr-hint">Cette inscription est encore modifiable.</p>
                    <div className="ins-trouvee-btns">
                      <button className="inscr-btn-next" onClick={() => reprendreInscription(inscriptionTrouvee)}>✏️ Modifier l'inscription</button>
                      <button className="inscr-btn-next" style={{ marginLeft: 12 }} onClick={() => setFicheInscription(inscriptionTrouvee)}>
                        📄 PDF fiche inscription
                      </button>
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

            <div style={{background:"#fef3c7", borderLeft:"4px solid #f59e0b", borderRadius:"0 8px 8px 0", padding:"1rem", marginBottom:"1rem"}}>
              <p style={{margin:0, fontSize:"0.875rem", color:"#92400e"}}>
                <strong>⚠️ Engagement annuel :</strong> Toute inscription implique un engagement annuel non remboursable en cas d'abandon. Tout trimestre entamé est dû dans sa totalité.
              </p>
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
                <p className="inscr-hint">⚠️ Renseignez d'abord la date de naissance pour voir les cours disponibles s'afficher dans "Activités choisies" ci-dessous.</p>
                <p className="inscr-hint">⚠️ Les champs marqués d'un astérisque (*) sont obligatoires.</p>
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
                        <select value={eleveCourant.niveauScolaire} onChange={(e) => updateEleve(eleveActif, "niveauScolaire", e.target.value)}>
                          <option value="">-- Choisir --</option>
                          <optgroup label="Maternelle">
                            <option value="PS">PS</option>
                            <option value="MS">MS</option>
                            <option value="GS">GS</option>
                          </optgroup>
                          <optgroup label="Primaire">
                            <option value="CP">CP</option>
                            <option value="CE1">CE1</option>
                            <option value="CE2">CE2</option>
                            <option value="CM1">CM1</option>
                            <option value="CM2">CM2</option>
                          </optgroup>
                          <optgroup label="Collège">
                            <option value="6ème">6ème</option>
                            <option value="5ème">5ème</option>
                            <option value="4ème">4ème</option>
                            <option value="3ème">3ème</option>
                          </optgroup>
                          <optgroup label="Lycée">
                            <option value="2nde">2nde</option>
                            <option value="1ère">1ère</option>
                            <option value="Terminale">Terminale</option>
                          </optgroup>
                          <optgroup label="Autres">
                            <option value="Étudiant">Étudiant</option>
                            <option value="Autre">Autre</option>
                          </optgroup>
                        </select>
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
                        <label>Lien de parenté *</label>
                        <select value={eleveCourant.parenté} onChange={(e) => updateEleve(eleveActif, "parenté", e.target.value)}>
                          <option value="">-- Choisir --</option>
                          <option value="Mère">Mère</option>
                          <option value="Père">Père</option>
                          <option value="Tuteur légal">Tuteur légal</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      {eleveCourant.parenté === "Autre" && (
                        <div className="field">
                          <label>Préciser le lien</label>
                          <input value={eleveCourant.parentéAutre || ""} onChange={(e) => updateEleve(eleveActif, "parentéAutre", e.target.value)} placeholder="Ex: grand-parent, oncle…" />
                        </div>
                      )}
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
                    disabled={eleves.some((e) => {
                      const age = getAge(e.dateNaissance);
                      const mineurSansRepr = age !== null && age < 18 && (!e.representantNom || !e.representantPrenom || !e.parenté);
                      return !e.nom || !e.prenom || !e.dateNaissance || !e.email || !e.telPerso || mineurSansRepr;
                    })}>
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
                        <React.Fragment key={i}>
                          <tr>
                            <td>{instr && <span>{instr.emoji} </span>}{instr ? `${instr.label} — ` : ""}{c.coursData.label}</td>
                            <td>{c.prixBase} €</td>
                            <td>{c.reductionAppliquee || "—"}</td>
                            <td className="prix-final">{c.prixFinal} €</td>
                          </tr>
                          {c.coursData.supplementMateriel > 0 && (
                            <tr>
                              <td style={{paddingLeft:"1.5rem", color:"#6b7280", fontStyle:"italic"}}>↳ Matériel — {c.coursData.label}</td>
                              <td>{c.coursData.supplementMateriel} €</td>
                              <td>—</td>
                              <td className="prix-final">{c.coursData.supplementMateriel} €</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr className="recap-cotisation"><td colSpan="3">Cotisation annuelle</td><td className="prix-final">{tarifs.cotisationAnnuelle} €</td></tr>
                    <tr className="recap-sous-total"><td colSpan="3"><strong>Sous-total {eleve.prenom}</strong></td><td className="prix-final"><strong>{eleve.totalEleve} €</strong></td></tr>
                  </tbody>
                </table>
              </div>
            ))}

            <div className="recap-total">
              <span>Total annuel</span>
              <span className="total-montant">{totalGeneral} €</span>
            </div>

            {/* Mode de paiement */}
            <section className="engagements-section" style={{marginBottom:"1rem"}}>
              <h3>Mode de règlement</h3>
              <p style={{fontSize:"0.875rem", color:"#6b7280", marginBottom:"1rem"}}>
                Le règlement s'effectue au bureau de l'école.
              </p>
              <div style={{display:"flex", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1rem"}}>
                {[
                  { id: "cheque", label: "🏦 Chèque(s)", info: "À l'ordre de l'EAM Haut-Bugey. Max 8 versements (1/mois), soldé avant fin avril." },
                  { id: "especes", label: "💶 Espèces", info: "Paiement intégral au bureau. Pas de versements." },
                  { id: "virement", label: "💳 Virement", info: "Paiement intégral. RIB fourni sur demande." },
                  { id: "mandat_sepa", label: "📋 Mandat SEPA", info: "Prélèvement automatique. +10€ de frais annuels. Max 8 versements." },
                ].map((m) => (
                  <button key={m.id}
                    className={`paiement-btn ${modePaiement.type === m.id ? "active" : ""}`}
                    onClick={() => setModePaiement({ ...modePaiement, type: m.id, nbFois: 1 })}>
                    {m.label}
                    {m.info && <span>{m.info}</span>}
                  </button>
                ))}
              </div>
              {modePaiement.type && (modePaiement.type === "cheque" || modePaiement.type === "mandat_sepa") && (
                <div style={{display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap"}}>
                  <label style={{fontSize:"0.875rem", fontWeight:600}}>Nombre de versements :</label>
                  <select
                    className="ia-select"
                    value={modePaiement.nbFois}
                    onChange={(e) => setModePaiement({ ...modePaiement, nbFois: Number(e.target.value) })}>
                    {Array.from({length:8},(_,i)=>i+1).map(n => (
                      <option key={n} value={n}>{n} fois{n===1?" (paiement unique)":""}</option>
                    ))}
                  </select>
                  {modePaiement.nbFois > 1 && (
                    <span style={{fontSize:"0.8rem", color:"#6b7280"}}>
                      soit {(totalGeneral / modePaiement.nbFois).toFixed(2)} €/versement
                    </span>
                  )}
                </div>
              )}
              {modePaiement.type === "cheque" && (
                <div style={{background:"#f0fdf4", borderRadius:8, padding:"0.75rem", marginTop:"0.75rem", fontSize:"0.875rem", color:"#166534", borderLeft:"3px solid #86efac"}}>
                  🏦 <strong>Chèque(s) à l'ordre de :</strong> EAMHB<br/>
                  À remettre au bureau de l'école. <br/>
                  <span style={{color:"#dc2626", fontWeight:700}}>⚠️ La totalité des chèques doit être remise à l'école lors de la confirmation de l'inscription.</span>
                </div>
              )}
              {modePaiement.type === "especes" && (
                <div style={{background:"#fefce8", borderRadius:8, padding:"0.75rem", marginTop:"0.75rem", fontSize:"0.875rem", color:"#854d0e", borderLeft:"3px solid #fde047"}}>
                  💶 Règlement en espèces directement au bureau de l'école. <br/>
                  <span style={{color:"#dc2626", fontWeight:700}}>⚠️ La totalité de la somme doit être réglée en une seule fois.</span>
                </div>
              )}
              {modePaiement.type === "virement" && (
                <div style={{background:"#e0f2fe", borderRadius:8, padding:"0.75rem", marginTop:"0.75rem", fontSize:"0.875rem", color:"#075985", borderLeft:"3px solid #7dd3fc"}}>
                  💳 <strong>Virement bancaire :</strong><br/>
                  IBAN : <strong>FR76 1009 6181 8400 0138 4350 118</strong><br/>
                  BIC : <strong>CMCIFRPP</strong><br/>
                  <span style={{color:"#dc2626", fontWeight:700}}>⚠️ Le virement doit couvrir la totalité de la facture.</span>
                </div>
              )}
              {modePaiement.type === "mandat_sepa" && (
                <div style={{background:"#f5f3ff", borderRadius:8, padding:"0.75rem", marginTop:"0.75rem", fontSize:"0.875rem", color:"#6b21a8", borderLeft:"3px solid #d8b4fe"}}>
                  <strong>📋 Mandat SEPA :</strong><br/>
                  L'école prélèvera automatiquement les versements sur votre compte bancaire.<br/>
                  <span style={{fontWeight:600}}>Frais annuels : +10 €</span>
                  <div style={{marginTop:"0.75rem", fontSize:"0.9rem"}}>Votre RIB vous sera demandé au bureau de l'école pour signature de l'autorisation de prélèvement.</div>
                  <span style={{color:"#dc2626", fontWeight:700, display:"block", marginTop:"0.5rem"}}>⚠️ Vous devrez vous présenter au bureau pour signer l'autorisation de prélèvement.</span>
                </div>
              )}
            </section>
            
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
                { key: "demission", label: "Je prends note que toute démission doit être formulée par écrit (lettre recommandée ou email). Des remboursements exceptionnels peuvent être accordés uniquement en cas de force majeure : déménagement lié à une mobilité professionnelle, perte d'emploi, ou problème de santé justifié par un certificat médical." },
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
                disabled={!modePaiement.type || !Object.entries(engagements).every(([k, v]) => k === "droitImage" ? v !== null : v === true)}>
                Envoyer l'inscription ✓
              </button>
            </div>
          </div>
        )}

        {/* -- Étape 4 : Confirmation -- */}
        {etape === "confirmation" && (
          <>
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
                  {modePaiement.type === "mandat_sepa" && <><br/>💡 N'oubliez pas de signer l'<strong>autorisation de prélèvement SEPA</strong> au bureau.</>}
                </p>
                <p className="confirm-modif-note">
                  Votre dossier reste <strong>modifiable en ligne</strong> jusqu'à sa prise en charge par l'équipe. Une fois validé, toute modification ultérieure devra se faire directement au bureau de l'école.
                </p>
              </div>

              <p className="confirm-contact">
                Des questions ? <strong>04 74 75 00 81</strong> · <a href="mailto:ecole@artsmusique-hb.fr">ecole@artsmusique-hb.fr</a>
              </p>
              <div className="confirm-actions">
                <button className="inscr-btn-submit" type="button" onClick={() => setFicheInscription({ code: inscriptionCode, foyer: { nbMembres, paiementType }, modePaiement, eleves: elevesAvecTotal })}>
                  Générer la fiche d'inscription
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      {ficheInscription && (
        <FicheInscriptionModal
          inscription={ficheInscription}
          apiUrl={API}
          onClose={() => setFicheInscription(null)}
        />
      )}

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
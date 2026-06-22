import React, { useState, useEffect, useRef } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR");
}

function arrondir(val) {
  return Math.round(val);
}

function calculerPrixFinal(prixBase, apply33pct, nbFoyer, yogaChorale) {
  let prixFinal = prixBase;
  let reduction = null;
  const hasFoyer = nbFoyer >= 2;
  if (apply33pct && !yogaChorale) {
    const r33 = prixBase / 3;
    const r10 = hasFoyer ? prixBase * 0.10 : 0;
    if (r33 > r10) {
      prixFinal = arrondir(prixBase - r33);
      reduction = `-${arrondir(r33)} € (-33,33%)`;
    } else if (r10 > 0) {
      prixFinal = arrondir(prixBase - r10);
      reduction = `-${arrondir(r10)} € (-10%)`;
    }
  } else if (hasFoyer) {
    const remise10 = prixBase * 0.10;
    prixFinal = arrondir(prixBase - remise10);
    reduction = `-${arrondir(remise10)} € (-10%)`;
  }
  return { prixFinal, reduction };
}

// ─── Styles inline reproduisant le PDF ───────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Arial', sans-serif",
    maxWidth: 860,
    margin: "0 auto",
    padding: "0 0 40px",
    background: "#fff",
    color: "#111",
    fontSize: 13,
  },
  noPrint: {
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    background: "#f0f0ff",
    borderBottom: "2px solid #9381FF",
    flexWrap: "wrap",
    alignItems: "center",
  },
  btnPrint: {
    padding: "8px 20px",
    background: "#6b21a8",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },
  btnReset: {
    padding: "8px 20px",
    background: "#fff",
    color: "#6b21a8",
    border: "2px solid #6b21a8",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },
  header: {
    background: "linear-gradient(135deg, #3a5a78 0%, #5b8aab 100%)",
    padding: "18px 24px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: "'Arial Black', Arial, sans-serif",
    fontSize: 26,
    fontWeight: 900,
    color: "#fff",
    fontStyle: "italic",
    letterSpacing: -0.5,
  },
  headerYear: {
    color: "#f59e0b",
    fontSize: 20,
    fontWeight: 900,
    fontStyle: "normal",
    marginLeft: 8,
  },
  headerSchool: {
    fontSize: 10,
    color: "#d1e8ff",
    textAlign: "right",
    lineHeight: 1.5,
  },
  body: {
    padding: "0 24px",
  },
  sectionTitle: {
    background: "transparent",
    color: "#e8272a",
    fontWeight: 900,
    fontSize: 13,
    padding: "3px 8px",
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
    display: "block",
    width: "100%",
    textAlign: "center",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 16px",
  },
  fieldRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #bbb",
    marginBottom: 5,
    gap: 6,
    minHeight: 26,
  },
  fieldLabel: {
    fontSize: 10,
    color: "#555",
    whiteSpace: "nowrap",
    fontWeight: 700,
    minWidth: 90,
  },
  fieldInput: {
    flex: 1,
    border: "none",
    borderBottom: "1.5px solid #6b21a8",
    outline: "none",
    fontSize: 12,
    padding: "2px 4px",
    background: "transparent",
    color: "#111",
    minWidth: 0,
  },
  fieldInputFull: {
    width: "100%",
    border: "none",
    borderBottom: "1.5px solid #6b21a8",
    outline: "none",
    fontSize: 12,
    padding: "2px 4px",
    background: "transparent",
    color: "#111",
  },
  fullRow: {
    gridColumn: "1 / -1",
  },
  actTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 6,
    fontSize: 11,
  },
  actTh: {
    background: "#222",
    color: "#fff",
    padding: "4px 6px",
    textAlign: "left",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  actTd: {
    padding: "3px 6px",
    borderBottom: "1px solid #ddd",
    verticalAlign: "middle",
  },
  actTdAlt: {
    padding: "3px 6px",
    borderBottom: "1px solid #ddd",
    verticalAlign: "middle",
    background: "#f5f0ff",
  },
  actNumCell: {
    width: 32,
    textAlign: "center",
    fontWeight: 700,
    fontSize: 11,
  },
  actCodeBadge: {
    display: "inline-block",
    background: "#222",
    color: "#fff",
    borderRadius: 3,
    padding: "1px 5px",
    fontSize: 10,
    fontWeight: 700,
    marginRight: 4,
  },
  actCodeBadgeColor: (color) => ({
    display: "inline-block",
    background: color,
    color: "#fff",
    borderRadius: 3,
    padding: "1px 5px",
    fontSize: 10,
    fontWeight: 700,
    marginRight: 4,
  }),
  tarifInput: {
    width: 60,
    border: "none",
    borderBottom: "1.5px solid #aaa",
    outline: "none",
    fontSize: 11,
    padding: "1px 3px",
    background: "transparent",
    color: "#111",
    textAlign: "right",
  },
  payInput: {
    border: "none",
    borderBottom: "1.5px solid #aaa",
    outline: "none",
    fontSize: 11,
    padding: "1px 4px",
    background: "#fff",
    color: "#111",
    width: 80,
    textAlign: "right",
  },
  tarifTotal: {
    fontWeight: 700,
    textAlign: "right",
    paddingRight: 4,
    fontSize: 12,
  },
  paySection: {
    marginTop: 12,
    padding: "8px 10px",
    border: "2px solid #222",
  },
  payTitle: {
    fontWeight: 900,
    fontSize: 14,
    textTransform: "uppercase",
    color: "#e8272a",
    letterSpacing: 1,
    textAlign: "center",
    width: "100%",
  },
  payRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "4px 0",
    flexWrap: "wrap",
  },
  payCheckbox: {
    width: 14,
    height: 14,
    accentColor: "#6b21a8",
    cursor: "pointer",
  },
  payInput: {
    border: "none",
    borderBottom: "1.5px solid #aaa",
    outline: "none",
    fontSize: 11,
    padding: "1px 4px",
    background: "transparent",
    color: "#111",
    width: 80,
    textAlign: "right",
  },
  payGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2px 20px",
    marginTop: 4,
  },
  payGridItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    borderBottom: "1px dashed #ccc",
    padding: "2px 0",
  },
  totalBox: {
    background: "#f5f0ff",
    border: "2px solid #6b21a8",
    padding: "6px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    float: "right",
    marginTop: 6,
    borderRadius: 4,
  },
  totalLabel: {
    fontWeight: 900,
    fontSize: 14,
    textTransform: "uppercase",
    color: "#6b21a8",
  },
  totalAmount: {
    fontWeight: 900,
    fontSize: 20,
    color: "#6b21a8",
  },
  engSection: {
    marginTop: 14,
    padding: "8px 10px",
    border: "2px solid #222",
  },
  engTitle: {
    fontWeight: 900,
    fontSize: 13,
    textTransform: "uppercase",
    color: "#e8272a",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
    width: "100%",
  },
  engItem: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 5,
    fontSize: 11,
    lineHeight: 1.4,
  },
  engCheckbox: {
    width: 14,
    height: 14,
    marginTop: 1,
    accentColor: "#222",
    cursor: "pointer",
    flexShrink: 0,
  },
  engLabel: {
    flex: 1,
  },
  engLabelBold: {
    fontWeight: 700,
  },
  droitBox: {
    border: "1px solid #aaa",
    padding: "6px 10px",
    marginBottom: 8,
    background: "#fafafa",
  },
  droitRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginTop: 4,
  },
  droitBtn: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    padding: "3px 12px",
    border: active ? "2px solid #222" : "1px solid #aaa",
    borderRadius: 3,
    fontWeight: active ? 700 : 400,
    background: active ? "#222" : "#fff",
    color: active ? "#fff" : "#222",
    fontSize: 11,
  }),
  signSection: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  signText: {
    fontSize: 11,
    flex: 1,
    minWidth: 200,
    lineHeight: 1.6,
  },
  signBox: {
    border: "1px solid #aaa",
    minWidth: 160,
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "4px 8px",
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
  },
  footer: {
    marginTop: 16,
    padding: "6px 10px",
    background: "#222",
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 1.6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 9999,
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },
  modalContent: {
    background: "#fff",
    maxWidth: 900,
    width: "100%",
    margin: "0 20px",
    borderRadius: 8,
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxHeight: "calc(100vh - 40px)",
    minHeight: 0,
  },
  divider: {
    borderTop: "2px solid #3a5a78",
    margin: "10px 0 6px",
  },
  representantSection: {
    background: "#fffbe6",
    border: "1px solid #f59e0b",
    padding: "6px 10px",
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 0,
  },
  representantTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#92400e",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  redText: { color: "#e8272a", fontWeight: 700 },
};

// ─── Activités catalogue ─────────────────────────────────────────────────────
// Numéros de référence tels que sur la fiche originale
const ACTIVITE_CODES = {
  batterie: { num: "01", color: "#222" },
  chant: { num: "02", color: "#222" },
  guitare: { num: "03", color: "#222" },
  piano: { num: "04", color: "#222" },
  violon: { num: "05", color: "#222" },
  alto: { num: "06", color: "#222" },
  clarinette: { num: "07", color: "#222" },
  cornet: { num: "08", color: "#666" },
  flute: { num: "09", color: "#666" },
  saxophone: { num: "10", color: "#666" },
  trompette: { num: "11", color: "#666" },
  fm: { num: "12", color: "#666" },
  mao: { num: "13", color: "#666" },
  eveil_musical: { num: "14", color: "#e8272a" },
  eveil_danse: { num: "15", color: "#1d4ed8" },
  danse_contemporaine: { num: "16", color: "#1d4ed8" },
  hiphop: { num: "17", color: "#1d4ed8" },
  chorale: { num: "18", color: "#16a34a" },
  groupe_vocal: { num: "19", color: "#16a34a" },
  theatre: { num: "20", color: "#ea580c" },
  arts_plastiques: { num: "21", color: "#7c3aed" },
  yoga: { num: "22", color: "#0891b2" },
};

function getActiviteCode(coursId, instrumentId) {
  if (instrumentId) {
    const key = instrumentId.toLowerCase();
    return ACTIVITE_CODES[key] || { num: "—", color: "#555" };
  }
  // Matching sur l'id du cours collectif
  const map = {
    pc_education_musicale: { num: "12", color: "#666" },
    pc_eveil_musical: { num: "14", color: "#e8272a" },
    pc_eveil_hiphop: { num: "15", color: "#1d4ed8" },
    pc_danse_contemporaine: { num: "16", color: "#1d4ed8" },
    pc_hiphop_breakdance_60: { num: "17", color: "#1d4ed8" },
    pc_hiphop_breakdance_75: { num: "17", color: "#1d4ed8" },
    pc_chorale: { num: "18", color: "#16a34a" },
    pc_groupe_vocal: { num: "19", color: "#16a34a" },
    pc_theatre_60: { num: "20", color: "#ea580c" },
    pc_theatre_90: { num: "20", color: "#ea580c" },
    pc_arts_plastiques_60: { num: "21", color: "#7c3aed" },
    pc_arts_plastiques_90: { num: "21", color: "#7c3aed" },
    pc_yoga_enfants: { num: "22", color: "#0891b2" },
    pc_yoga_adultes: { num: "22", color: "#0891b2" },
  };
  return map[coursId] || { num: "—", color: "#555" };
}

// ─── Composant champ éditable ────────────────────────────────────────────────
function Field({ label, value, onChange, style, placeholder, type = "text" }) {
  return (
    <div style={S.fieldRow}>
      {label && <span style={S.fieldLabel}>{label}</span>}
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...S.fieldInput, ...style }}
      />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function FicheInscription({
  inscription = null,    // données de l'inscription complète (depuis API)
  tarifs = null,         // données tarifs depuis API
  eleveIndex = 0,        // index de l'élève dans le foyer (si plusieurs)
  apiUrl = "",           // VITE_API_URL
  onClose = null,
}) {
  const [tarifsData, setTarifsData] = useState(tarifs);
  const [contactInfo, setContactInfo] = useState({ phone: "04 74 75 00 81", email: "ecole@artsmusique-hb.fr" });
  const [eleve, setEleve] = useState(null);
  const [engagements, setEngagements] = useState({
    whatsapp: false, assurance: false, mineurs: false,
    responsabilite: false, absences: false, paiement: false,
    reglement: false, demission: false,
  });
  const [droitImage, setDroitImage] = useState(null); // "oui" | "non" | null
  const [lignes, setLignes] = useState([]); // lignes du tableau activités
  const [totalCalcule, setTotalCalcule] = useState(0);
  const [modePaiement, setModePaiement] = useState({ type: "", nbFois: 1 });
  const printRef = useRef();

  // Charger les tarifs si pas fournis
  useEffect(() => {
    if (!tarifsData && apiUrl) {
      fetch(`${apiUrl}/api/tarifs`)
        .then((r) => r.json())
        .then(setTarifsData)
        .catch(console.error);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/contact`)
      .then((r) => r.json())
      .then((data) => setContactInfo((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, [apiUrl]);

  // Initialiser depuis l'inscription
  useEffect(() => {
    if (!inscription) return;
    const e = inscription.eleves?.[eleveIndex];
    if (e) {
      setEleve({ ...e });
      if (inscription.engagements) setEngagements((prev) => ({ ...prev, ...inscription.engagements }));
      if (inscription.engagements) setDroitImage(inscription.engagements.droitImage ?? null);
      if (inscription.modePaiement) setModePaiement(inscription.modePaiement);
    }
  }, [inscription, eleveIndex]);

  // Calculer les lignes du tableau à partir des cours choisis
  useEffect(() => {
    if (!eleve || !tarifsData) return;
    const age = getAge(eleve.dateNaissance);
    const estMajeur = age !== null && age >= 18;
    const coursChoisis = eleve.coursDetails || eleve.coursChoisis || [];
    const nbFoyer = inscription?.foyer?.nbMembres || inscription?.eleves?.length || 1;
    const paiementType = inscription?.foyer?.paiementType || "annuel";

    const prixBaseByIndex = coursChoisis.map((c) => {
      const coursData = c.coursData;
      const tarif = estMajeur ? coursData?.tarifs?.majeur : coursData?.tarifs?.mineur;
      return tarif ? (paiementType === "annuel" ? tarif.annuel : tarif.trimestre) : 0;
    });

    const eligibleIndices = coursChoisis
      .map((c, idx) => (!c.coursData?.yogaChorale ? idx : null))
      .filter((idx) => idx !== null);

    const discountLineIndex = eligibleIndices.length >= 2
      ? eligibleIndices.reduce((best, idx) => {
          return prixBaseByIndex[idx] < prixBaseByIndex[best] ? idx : best;
        }, eligibleIndices[0])
      : -1;

    const newLignes = coursChoisis.map((c, idx) => {
      const coursData = c.coursData;
      if (!coursData) return null;
      const tarif = estMajeur ? coursData.tarifs?.majeur : coursData.tarifs?.mineur;
      const prixBase = tarif
        ? (paiementType === "annuel" ? tarif.annuel : tarif.trimestre)
        : 0;

      const eligible = !coursData.yogaChorale;
      const { prixFinal, reduction } = calculerPrixFinal(
        prixBase,
        eligible && idx === discountLineIndex,
        nbFoyer,
        coursData.yogaChorale
      );

      const instr = c.instrumentId && tarifsData.instruments
        ? tarifsData.instruments.find((i) => i.id === c.instrumentId)
        : null;

      const actCode = getActiviteCode(coursData.id, c.instrumentId);

      return {
        id: c.id || c.coursData?.id,
        num: actCode.num,
        color: actCode.color,
        label: instr ? `${instr.emoji} ${instr.label} — ${coursData.label}` : coursData.label,
        prixBase,
        prixFinal,
        reduction,
        supplementMateriel: coursData.supplementMateriel || 0,
        paiementType,
        _manualPrix: null,
      };
    }).filter(Boolean);

    setLignes(newLignes);

    const cotisation = tarifsData.cotisationAnnuelle || 25;
    const sepaFrais = (modePaiement.type === "mandat_sepa" || modePaiement.type === "cepa") ? 10 : 0;
    const total = newLignes.reduce((s, l) => s + (l.prixFinal || 0) + (l.supplementMateriel || 0), 0) + cotisation + sepaFrais;
    setTotalCalcule(total);
  }, [eleve, tarifsData, inscription, modePaiement.type]);

  const updateLignePrix = (idx, val) => {
    setLignes((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], _manualPrix: val };
      return updated;
    });
  };

  const updateField = (field, val) => {
    setEleve((prev) => ({ ...prev, [field]: val }));
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;

    // Récupérer les styles inline du document courant
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

    const content = printRef.current?.innerHTML || '';

    w.document.write(`<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Fiche d'inscription</title>
        ${styles}
        <style>
            body { font-family: Arial, sans-serif; color: #111; background: #fff; margin: 0; }
            .no-print { display: none !important; }
            input { border: none !important; border-bottom: 1px solid #999 !important; background: transparent !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { margin: 1.5cm; size: A4; }
        </style>
        <span style={{ fontSize: 11, color: "#6b7280" }}>
        💡 Pour les couleurs, activez « Graphiques d'arrière-plan » dans les options d'impression
        </span>
    </head>
    <body>${content}</body>
    </html>`);

    w.document.close();
    w.focus();
    setTimeout(() => {
        w.print();
        w.close();
    }, 300);
  };

  if (!eleve) {
    return (
      <div style={{ ...S.page, padding: 24 }}>
        <p style={{ color: "#6b7280", textAlign: "center" }}>
          Chargement de la fiche…
        </p>
      </div>
    );
  }

  const age = getAge(eleve.dateNaissance);
  const estMajeur = age !== null && age >= 18;
  const cotisation = tarifsData?.cotisationAnnuelle || 25;
  const paiementType = inscription?.foyer?.paiementType || "annuel";
  const anneeLabel = inscription?.annee || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <div className="fiche-page" style={S.page} ref={printRef}>
      {/* ── Barre d'actions (non imprimée) */}
      <div style={S.noPrint} className="no-print">
        <span style={{ fontWeight: 700, color: "#6b21a8", fontSize: 14 }}>
          📄 Fiche d'inscription 2025–2026 — {eleve.prenom} {eleve.nom}
        </span>
        <div style={{ flex: 1 }} />
        <button style={S.btnPrint} onClick={handlePrint}>🖨️ Imprimer / Enregistrer PDF</button>
        {onClose && <button style={S.btnReset} onClick={onClose}>✕ Fermer</button>}
      </div>

      {/* ── En-tête */}
      <div style={S.header}>
        <div>
          <span style={S.headerTitle}>
            Fiche d'inscription
          </span>
          <span style={S.headerYear}>{anneeLabel}</span>
        </div>
        <div style={S.headerSchool}>
          <strong>École Arts &amp; Musique du Haut-Bugey</strong><br />
          31 r. du Dr. Mercier 01130 Nantua<br />
          T. {contactInfo.phone} — <a href={`mailto:${contactInfo.email}`} style={{ color: "#fff", textDecoration: "underline" }}>{contactInfo.email}</a>
        </div>
      </div>

      <div style={S.body}>

        {/* ── Identité élève */}
        <div style={{ ...S.sectionTitle, marginTop: 10 }}>ÉLÈVE</div>
        <div style={S.grid2}>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Nom</span>
            <input style={S.fieldInputFull} value={eleve.nom || ""} onChange={(e) => updateField("nom", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Prénom(s)</span>
            <input style={S.fieldInputFull} value={eleve.prenom || ""} onChange={(e) => updateField("prenom", e.target.value)} />
            <span style={{ fontSize: 11, marginLeft: 8, display: "flex", gap: 6 }}>
              {["F", "M"].map((s) => (
                <label key={s} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                  <input
                    type="checkbox"
                    checked={eleve.sexe === s}
                    onChange={() => updateField("sexe", s)}
                    style={S.engCheckbox}
                  />
                  {s}
                </label>
              ))}
            </span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Né(e) le</span>
            <input
              type="date"
              style={{ ...S.fieldInput, width: 130 }}
              value={eleve.dateNaissance || ""}
              onChange={(e) => updateField("dateNaissance", e.target.value)}
            />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Âge</span>
            <input
              style={{ ...S.fieldInput, width: 50, fontWeight: 700 }}
              value={age !== null ? `${age} ans` : ""}
              readOnly
            />
            <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>
              {estMajeur ? "(Majeur)" : "(Mineur)"}
            </span>
          </div>
          <div style={{ ...S.fieldRow, ...S.fullRow }}>
            <span style={S.fieldLabel}>Adresse</span>
            <input style={S.fieldInputFull} value={eleve.adresse || ""} onChange={(e) => updateField("adresse", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Code postal</span>
            <input style={{ ...S.fieldInput, width: 80 }} value={eleve.codePostal || ""} onChange={(e) => updateField("codePostal", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Localité</span>
            <input style={S.fieldInputFull} value={eleve.localite || ""} onChange={(e) => updateField("localite", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Tél. 1</span>
            <input style={S.fieldInputFull} value={eleve.telPerso || ""} onChange={(e) => updateField("telPerso", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Tél. 2</span>
            <input style={S.fieldInputFull} value={eleve.tel2 || ""} onChange={(e) => updateField("tel2", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Email</span>
            <input style={S.fieldInputFull} value={eleve.email || ""} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>{!estMajeur ? "Niveau scol." : "Profession"}</span>
            <input
              style={S.fieldInputFull}
              value={!estMajeur ? (eleve.niveauScolaire || "") : (eleve.profession || "")}
              onChange={(e) => updateField(!estMajeur ? "niveauScolaire" : "profession", e.target.value)}
            />
          </div>
          {!estMajeur && (
            <div style={S.fieldRow}>
              <span style={S.fieldLabel}>Établissement</span>
              <input style={S.fieldInputFull} value={eleve.etablissement || ""} onChange={(e) => updateField("etablissement", e.target.value)} />
            </div>
          )}
        </div>

        {/* ── Représentant légal */}
        {!estMajeur && (
          <div style={S.representantSection}>
            <div style={S.representantTitle}>Représentant légal</div>
            <div style={S.grid2}>
              <div style={S.fieldRow}>
                <span style={S.fieldLabel}>Nom</span>
                <input style={S.fieldInputFull} value={eleve.representantNom || ""} onChange={(e) => updateField("representantNom", e.target.value)} />
              </div>
              <div style={S.fieldRow}>
                <span style={S.fieldLabel}>Prénom(s)</span>
                <input style={S.fieldInputFull} value={eleve.representantPrenom || ""} onChange={(e) => updateField("representantPrenom", e.target.value)} />
              </div>
              <div style={S.fieldRow}>
                <span style={S.fieldLabel}>Parenté</span>
                <input style={S.fieldInputFull} value={eleve.parenté || ""} onChange={(e) => updateField("parenté", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div style={S.divider} />

        {/* ── Catalogue activités (légende) */}
        <div style={S.sectionTitle}>Choix d'activités</div>

        {/* Légende numérotée des activités disponibles */}
        {tarifsData && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
            {[
              { label: "BATTERIE", num: "01", color: "#222" },
              { label: "CHANT", num: "02", color: "#222" },
              { label: "GUITARE", num: "03", color: "#222" },
              { label: "PIANO", num: "04", color: "#222" },
              { label: "VIOLON", num: "05", color: "#222" },
              { label: "ALTO", num: "06", color: "#222" },
              { label: "CLARINETTE", num: "07", color: "#222" },
              { label: "FLÛTE", num: "09", color: "#666" },
              { label: "TROMPETTE", num: "11", color: "#666" },
              { label: "FM", num: "12", color: "#666" },
              ...(tarifsData.pratiquesCollectives || []).map((pc) => {
                const c = getActiviteCode(pc.id, null);
                return { label: pc.label.toUpperCase(), num: c.num, color: c.color };
              }).filter((x, i, arr) => arr.findIndex((a) => a.num === x.num) === i),
            ].map((act, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, whiteSpace: "nowrap",
                marginRight: 6, marginBottom: 2,
              }}>
                <span style={{
                  background: act.color, color: "#fff",
                  padding: "1px 5px", fontWeight: 700, fontSize: 10, borderRadius: 2,
                }}>{act.num}</span>
                {act.label}
              </span>
            ))}
          </div>
        )}

        {/* Tableau des activités inscrites */}
        <table style={S.actTable}>
          <thead>
            <tr>
              <th style={{ ...S.actTh, width: 28, textAlign: "center" }}>N°</th>
              <th style={S.actTh}>Activité</th>
              <th style={{ ...S.actTh, width: 90, textAlign: "right" }}>Tarif ({paiementType === "annuel" ? "annuel" : "trimestre"})</th>
              <th style={{ ...S.actTh, width: 50, textAlign: "center" }}>Réduction</th>
              <th style={{ ...S.actTh, width: 75, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...S.actTd, color: "#9ca3af", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                  Aucune activité sélectionnée
                </td>
              </tr>
            )}
            {lignes.map((ligne, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 1 ? "#f9f7ff" : "#fff" }}>
                <td style={{ ...S.actTd, textAlign: "center" }}>
                  <span style={{
                    background: ligne.color, color: "#fff",
                    padding: "1px 6px", fontWeight: 700, fontSize: 11, borderRadius: 2,
                  }}>{ligne.num}</span>
                </td>
                <td style={S.actTd}>{ligne.label}</td>
                <td style={{ ...S.actTd, textAlign: "right" }}>
                  <input
                    style={S.tarifInput}
                    value={ligne.prixBase ? `${ligne.prixBase} €` : ""}
                    readOnly
                  />
                </td>
                <td style={{ ...S.actTd, textAlign: "center", color: "#059669", fontWeight: 700, fontSize: 11 }}>
                  {ligne.reduction || "—"}
                </td>
                <td style={S.tarifTotal}>
                  {`${ligne.prixFinal} €`}
                </td>
              </tr>
            ))}
            {/* Supplément matériel si applicable */}
            {lignes.filter((l) => l.supplementMateriel > 0).map((l, i) => (
              <tr key={`mat-${i}`} style={{ background: "#fef9e7" }}>
                <td style={S.actTd} />
                <td style={{ ...S.actTd, fontStyle: "italic", color: "#92400e", fontSize: 11 }}>
                  ↳ Supplément matériel — {l.label}
                </td>
                <td style={{ ...S.actTd, textAlign: "right", fontStyle: "italic", fontSize: 11 }}>
                  {l.supplementMateriel} €
                </td>
                <td style={S.actTd}>—</td>
                <td style={{ ...S.tarifTotal, color: "#92400e" }}>{l.supplementMateriel} €</td>
              </tr>
            ))}
            {/* Cotisation */}
            <tr style={{ background: "#f0fdf4" }}>
              <td style={S.actTd} />
              <td style={{ ...S.actTd, fontStyle: "italic", color: "#166534", fontSize: 11 }}>
                Cotisation annuelle
              </td>
              <td style={{ ...S.actTd, textAlign: "right", fontStyle: "italic", fontSize: 11 }}>
                {cotisation} €
              </td>
              <td style={S.actTd}>—</td>
              <td style={{ ...S.tarifTotal, color: "#166534" }}>{cotisation} €</td>
            </tr>
            {(modePaiement.type === "mandat_sepa" || modePaiement.type === "cepa") && (
              <tr style={{ background: "#eef2ff" }}>
                <td style={S.actTd} />
                <td style={{ ...S.actTd, fontStyle: "italic", color: "#1d4ed8", fontSize: 11 }}>
                  Frais de mandat SEPA
                </td>
                <td style={{ ...S.actTd, textAlign: "right", fontStyle: "italic", fontSize: 11 }}>
                  10 €
                </td>
                <td style={S.actTd}>—</td>
                <td style={{ ...S.tarifTotal, color: "#1d4ed8" }}>10 €</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ overflow: "hidden", marginBottom: 4 }}>
          <div style={S.totalBox}>
            <span style={S.totalLabel}>À PAYER</span>
            <span style={S.totalAmount}>{totalCalcule} €</span>
          </div>
        </div>
        <div style={{ clear: "both" }} />

        {/* ── Paiement */}
        <div style={S.paySection}>
          <div style={S.payTitle}>Paiement</div>
          <div style={{ ...S.payRow, marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Préinscription :</span>
            <label style={{ ...S.engItem, marginBottom: 0, fontSize: 11 }}>
              <input type="checkbox" style={S.payCheckbox} />
              un versement de <strong style={{ margin: "0 4px" }}>80 €</strong> d'arrhes est requis.
            </label>
          </div>
          <div style={S.payRow}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Inscription : paiement en</span>
            {[1, 2, 3, "X"].map((n) => (
              <label key={n} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  style={S.payCheckbox}
                  checked={modePaiement.nbFois === n}
                  onChange={() => setModePaiement((p) => ({ ...p, nbFois: n }))}
                />
                {n}{n !== "X" && "X"}
              </label>
            ))}
          </div>

          {/* Grille des versements */}
          <div style={S.payGrid}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={S.payGridItem}>
                <span style={{ color: "#e8272a", fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
                <input style={{ ...S.payInput, width: 70 }} placeholder="Montant €" />
                <span style={{ fontSize: 10 }}>le</span>
                <input style={{ ...S.payInput, width: 90 }} placeholder="Date" />
                <span style={{ fontSize: 10, color: "#aaa" }}>{i < 5 ? "Réf." : "N°"}</span>
                <input style={{ ...S.payInput, width: 70 }} placeholder="" />
              </div>
            ))}
          </div>

          {/* Mode de paiement */}
          <div style={{ ...S.payRow, marginTop: 8, background: "#f5f5f5", padding: "6px 8px", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Mode de règlement :</span>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { id: "cheque", label: "🏦 Chèque(s) à l'ordre de EAMHB" },
                { id: "especes", label: "💶 Espèces" },
                { id: "virement", label: "💳 Virement" },
              { id: "cepa", label: "📄 CEPA" },
              ].map((m) => (
                <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
                  <input
                    type="checkbox"
                    style={S.payCheckbox}
                    checked={modePaiement.type === m.id}
                    onChange={() => setModePaiement((p) => ({ ...p, type: m.id }))}
                  />
                  {m.label}
                </label>
              ))}
            </div>
            {modePaiement.type === "virement" && (
              <div style={{ fontSize: 10, color: "#075985", marginTop: 4, background: "#e0f2fe", padding: "3px 8px", borderRadius: 3 }}>
                IBAN : <strong>FR76 1009 6181 8400 0138 4350 118</strong> — BIC : <strong>CMCIFRPP</strong>
              </div>
            )}
            {modePaiement.type === "cepa" && (
              <div style={{ fontSize: 10, color: "#075985", marginTop: 4, background: "#e0f2fe", padding: "3px 8px", borderRadius: 3 }}>
                CEPA sélectionné. Merci de présenter le dossier au bureau pour validation.
              </div>
            )}
          </div>
        </div>

        <div style={S.divider} />

        {/* ── Droits à l'image */}
        <div style={S.engSection}>
          <div style={S.engTitle}>Déclaration et Engagement</div>

          <div style={S.droitBox}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>DROITS À L'IMAGE :</span>
            <span style={{ fontSize: 11, display: "block", marginTop: 2 }}>
              Autorisez-vous l'École Arts et Musique du Haut-Bugey à photographier ou filmer votre enfant ou vous-même dans le cadre des activités de l'établissement, et à utiliser ces images sur ses supports de communication ou dans la presse ?
            </span>
            <div style={S.droitRow}>
              <button style={S.droitBtn(droitImage === "oui")} onClick={() => setDroitImage("oui")}>OUI</button>
              <button style={S.droitBtn(droitImage === "non")} onClick={() => setDroitImage("non")}>NON</button>
            </div>
          </div>

          {[
            {
              key: "whatsapp",
              label: <><strong>WhatsApp :</strong> J'autorise l'école à intégrer mon numéro dans un groupe WhatsApp dédié à la communication d'informations utiles concernant la scolarité de mon enfant ou moi-même.</>
            },
            {
              key: "assurance",
              label: <><strong>Assurance :</strong> Je certifie que mon enfant ou moi-même sommes couverts par une assurance responsabilité civile.</>
            },
            {
              key: "mineurs",
              label: <><strong>Mineurs :</strong> Pour les élèves mineurs, je m'engage à respecter les horaires, à m'assurer de la présence du professeur avant de déposer mon enfant, et à venir le récupérer dès la fin du cours.</>
            },
            {
              key: "responsabilite",
              label: <><strong>Responsabilité :</strong> Je dégage l'établissement de toute responsabilité en dehors des heures de cours.</>
            },
            {
              key: "absences",
              label: <><strong>Absences :</strong> Je m'engage à prévenir l'enseignant à l'avance de toute absence de mon enfant ou de moi-même.</>
            },
            {
              key: "paiement",
              label: <><strong>Paiement :</strong> Je m'engage à régler la totalité de la facture, en un seul versement ou en plusieurs mensualités prélevées en début de chaque mois consécutif.</>
            },
            {
              key: "reglement",
              label: <><strong>Règlement &amp; engagement :</strong> J'atteste avoir pris connaissance du règlement intérieur et des conditions de fonctionnement de l'École Arts et Musique du Haut-Bugey (tarifs, admission, etc.), et <span style={{ color: "#e8272a", fontWeight: 700 }}>je reconnais que toute inscription implique un engagement annuel non remboursable en cas d'abandon.</span></>
            },
            {
              key: "demission",
              label: <><strong>Démission :</strong> Toute démission doit être formulée par écrit (lettre recommandée ou email). Des remboursements exceptionnels peuvent être accordés uniquement en cas de force majeure : déménagement lié à une mobilité professionnelle, perte d'emploi, ou problème de santé justifié par un certificat médical.</>
            },
          ].map(({ key, label }) => (
            <div key={key} style={S.engItem}>
              <input
                type="checkbox"
                style={S.engCheckbox}
                checked={!!engagements[key]}
                onChange={(e) => setEngagements((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              <span style={S.engLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Signature */}
        <div style={S.signSection}>
          <div style={S.signText}>
            Je soussigné(e){" "}
            <input
              style={{ ...S.fieldInput, width: 200, display: "inline" }}
              placeholder="Nom et prénom"
              defaultValue={
                !estMajeur
                  ? `${eleve.representantPrenom || ""} ${eleve.representantNom || ""}`.trim()
                  : `${eleve.prenom || ""} ${eleve.nom || ""}`.trim()
              }
            />{" "}
            accepte les conditions précitées et veille au respect du règlement intérieur de l'établissement.
            <br />
            <br />
            Fait à <strong>NANTUA</strong> le{" "}
            <input
              type="date"
              style={{ ...S.fieldInput, width: 140, display: "inline" }}
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div style={S.signBox}>
            <span>Signature</span>
          </div>
        </div>

        {/* ── Code dossier */}
        {inscription?.code && (
          <div style={{
            marginTop: 10,
            background: "#f3e8ff",
            border: "1.5px solid #6b21a8",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 4,
            fontSize: 12,
          }}>
            <span style={{ color: "#6b21a8", fontWeight: 700 }}>Code dossier :</span>
            <span style={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#4c1d95",
            }}>{inscription.code}</span>
            <span style={{ color: "#9ca3af", fontSize: 10 }}>
              — Conservez ce code pour retrouver et modifier votre inscription.
            </span>
          </div>
        )}
      </div>

      {/* ── Footer */}
      <div style={S.footer}>
        <strong>Ecole Arts &amp; Musique du Haut-Bugey</strong> : 31 r. du Dr. Mercier 01130 Nantua — T. {contactInfo.phone} — <a href={`mailto:${contactInfo.email}`} style={{ color: "#fff", textDecoration: "underline" }}>{contactInfo.email}</a><br />
        Paiement à l'Ordre de <strong>EAMHB</strong> — Virement IBAN : <strong>FR76 1009 6181 8400 0138 4350 118</strong> — BIC : <strong>CMCIFRPP</strong>
      </div>

      {/* ── CSS Print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          input { border: none !important; border-bottom: 1px solid #999 !important; }
        }
        @page { margin: 1.5cm; size: A4; }
      `}</style>
    </div>
  );
}

// ─── Export aussi un wrapper standalone pour affichage en fin de formulaire ───
export function FicheInscriptionModal({ inscription, apiUrl, onClose }) {
  const [tarifs, setTarifs] = useState(null);
  const [eleveIndex, setEleveIndex] = useState(0);

  useEffect(() => {
    if (apiUrl) {
      fetch(`${apiUrl}/api/tarifs`)
        .then((r) => r.json())
        .then(setTarifs)
        .catch(console.error);
    }
  }, [apiUrl]);

  const eleves = inscription?.eleves || [];

  return (
    <div className="fiche-modal-overlay" style={S.modalOverlay}>
      <style>{`
        @media print {
          .fiche-modal-overlay { position: static !important; overflow: visible !important; background: transparent !important; }
          .fiche-modal-content { max-height: none !important; overflow: visible !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; width: auto !important; }
          .no-print { display: none !important; }
          .fiche-page { page-break-after: auto; page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
      <div className="fiche-modal-content" style={S.modalContent}>
        {/* Sélecteur d'élève si foyer multiple */}
        {eleves.length > 1 && (
          <div style={{
            padding: "8px 16px",
            background: "#f3e8ff",
            borderBottom: "2px solid #9381FF",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b21a8" }}>Fiche pour :</span>
            {eleves.map((e, i) => (
              <button
                key={i}
                onClick={() => setEleveIndex(i)}
                style={{
                  padding: "4px 12px",
                  background: eleveIndex === i ? "#6b21a8" : "#fff",
                  color: eleveIndex === i ? "#fff" : "#6b21a8",
                  border: "1.5px solid #6b21a8",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {e.prenom} {e.nom}
              </button>
            ))}
          </div>
        )}

        <FicheInscription
          inscription={inscription}
          tarifs={tarifs}
          eleveIndex={eleveIndex}
          apiUrl={apiUrl}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
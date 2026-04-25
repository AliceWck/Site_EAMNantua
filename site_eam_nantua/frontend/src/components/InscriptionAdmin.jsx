import { useState, useEffect } from "react";
import "./InscriptionAdmin.css";

const API = import.meta.env.VITE_API_URL;

// Tags canoniques — synchronisés avec InscriptionForm.jsx
const TAGS_DEF = [
  { id: "eveil_3_5",    label: "Éveil 3–5 ans",    desc: "3 à 5 ans" },
  { id: "enfant_6_10",  label: "Enfant 6–10 ans",  desc: "6 à 10 ans" },
  { id: "enfant_7_10",  label: "Enfant 7–10 ans",  desc: "7 à 10 ans" },
  { id: "enfant_11_15", label: "Enfant 11–15 ans", desc: "11 à 15 ans" },
  { id: "enfant_12_15", label: "Enfant 12–15 ans", desc: "12 à 15 ans" },
  { id: "ado_16plus",   label: "Ado 16–17 ans",    desc: "16 à 17 ans" },
  { id: "adulte",       label: "Adulte 18+",        desc: "18 ans et plus" },
];

function TagSelector({ tags = [], onChange }) {
  const toggle = (id) =>
    onChange(tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id]);
  return (
    <div className="tag-selector">
      <p className="tag-selector-label">Tranches d'âge éligibles :</p>
      <div className="tag-selector-btns">
        {TAGS_DEF.map((t) => (
          <button key={t.id} type="button" className={`tag-btn ${tags.includes(t.id) ? "active" : ""}`}
            onClick={() => toggle(t.id)} title={t.desc}>
            {t.label}
          </button>
        ))}
      </div>
      {tags.length === 0 && <p className="tag-warning">⚠️ Aucun tag = cours visible pour tous les âges</p>}
    </div>
  );
}

export default function InscriptionAdmin() {
  const [tarifs, setTarifs] = useState(null);
  const [activeSection, setActiveSection] = useState("cp");
  const [message, setMessage] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/tarifs`)
      .then((r) => r.json())
      .then(setTarifs)
      .catch(() => setMessage("❌ Erreur chargement tarifs"));
  }, []);

  const save = async (newTarifs) => {
    try {
      const res = await fetch(`${API}/api/tarifs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTarifs),
      });
      if (res.ok) { setTarifs(newTarifs); showMsg("✅ Tarifs mis à jour !"); }
      else showMsg("❌ Erreur lors de la sauvegarde.");
    } catch { showMsg("❌ Erreur réseau."); }
  };

  const showMsg = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3500); };

  const deepUpdate = (obj, fieldPath, value) => {
    const path = fieldPath.split(".");
    const updated = JSON.parse(JSON.stringify(obj));
    let target = updated;
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]] || typeof target[path[i]] !== "object") target[path[i]] = {};
      target = target[path[i]];
    }
    const last = path[path.length - 1];
    if (value === null) target[last] = null;
    else if (value === "") target[last] = null;
    else if (value === true || value === false) target[last] = value;
    else if (!isNaN(value) && value !== "") target[last] = Number(value);
    else target[last] = value;
    return updated;
  };

  const updateCP = (idx, field, value) => {
    const updated = { ...tarifs };
    updated.coursParticuliers[idx] = deepUpdate(updated.coursParticuliers[idx], field, value);
    setTarifs({ ...updated });
  };

  const updatePC = (idx, field, value) => {
    const updated = { ...tarifs };
    updated.pratiquesCollectives[idx] = deepUpdate(updated.pratiquesCollectives[idx], field, value);
    setTarifs({ ...updated });
  };

  const deleteCP = (idx) => {
    if (!confirm("Supprimer ce cours particulier ?")) return;
    save({ ...tarifs, coursParticuliers: tarifs.coursParticuliers.filter((_, i) => i !== idx) });
  };
  const deletePC = (idx) => {
    if (!confirm("Supprimer cette pratique collective ?")) return;
    save({ ...tarifs, pratiquesCollectives: tarifs.pratiquesCollectives.filter((_, i) => i !== idx) });
  };

  if (!tarifs) return <div className="ia-loading">Chargement…</div>;

  return (
    <div className="inscr-admin">
      <h2>📋 Gestion des tarifs &amp; cours</h2>

      <div className="ia-tabs">
        {[
          { id: "cp", label: "🎵 Cours particuliers" },
          { id: "pc", label: "🎭 Pratiques collectives" },
          { id: "instr", label: "🎸 Instruments" },
          { id: "reduc", label: "💸 Réductions" },
          { id: "inscrits", label: "📊 Inscrits" },
          { id: "annees", label: "📅 Années scolaires" },
        ].map((t) => (
          <button key={t.id} className={`ia-tab ${activeSection === t.id ? "active" : ""}`} onClick={() => setActiveSection(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="ia-message">{message}</div>}

      {/* ── Cours particuliers ── */}
      {activeSection === "cp" && (
        <div className="ia-section">
          <div className="ia-section-header">
            <h3>Cours particuliers d'instruments</h3>
            <button className="ia-btn-add" onClick={() => setShowNewForm(showNewForm === "cp" ? false : "cp")}>
              {showNewForm === "cp" ? "✕ Fermer" : "➕ Ajouter"}
            </button>
          </div>
          {showNewForm === "cp" && (
            <NouveauCP onAdd={(n) => { save({ ...tarifs, coursParticuliers: [...tarifs.coursParticuliers, n] }); setShowNewForm(false); }} onCancel={() => setShowNewForm(false)} />
          )}
          {tarifs.coursParticuliers.map((cp, idx) => (
            <div key={cp.id} className="ia-card">
              <div className="ia-card-header">
                <strong>{cp.label}</strong>
                <div className="ia-card-actions">
                  <button className="ia-btn-sm" onClick={() => setEditingItem(editingItem === `cp-${idx}` ? null : `cp-${idx}`)}>
                    {editingItem === `cp-${idx}` ? "▲ Fermer" : "✏️ Modifier"}
                  </button>
                  <button className="ia-btn-sm danger" onClick={() => deleteCP(idx)}>🗑️</button>
                </div>
              </div>
              {editingItem !== `cp-${idx}` && (
                <div className="ia-card-summary">
                  <span>Âge : {cp.ageMin ?? 0}–{cp.ageMax ?? "∞"} ans</span>
                  <span>Mineur : {cp.tarifs?.mineur?.trimestre}€/trim · {cp.tarifs?.mineur?.annuel}€/an</span>
                  <span>Majeur : {cp.tarifs?.majeur?.trimestre}€/trim · {cp.tarifs?.majeur?.annuel}€/an</span>
                  {cp.duo && <span className="ia-tag">DUO</span>}
                  {cp.inclusFM && <span className="ia-tag green">+FM</span>}
                </div>
              )}
              {editingItem === `cp-${idx}` && (
                <div className="ia-edit-form">
                  <div className="ia-grid">
                    <F label="Label du cours" value={cp.label} onChange={(v) => updateCP(idx, "label", v)} />
                    <F label="ID unique" value={cp.id} onChange={(v) => updateCP(idx, "id", v)} />
                    <F label="Âge minimum (ans)" type="number" value={cp.ageMin ?? ""} onChange={(v) => updateCP(idx, "ageMin", v)} />
                    <F label="Âge maximum (vide = sans limite)" type="number" value={cp.ageMax ?? ""} onChange={(v) => updateCP(idx, "ageMax", v === "" ? null : v)} />
                    <div className="ia-grid-full ia-subheading">🔵 Mineur (-18 ans)</div>
                    <F label="Tarif mineur — trimestre (€)" type="number" value={cp.tarifs?.mineur?.trimestre ?? ""} onChange={(v) => updateCP(idx, "tarifs.mineur.trimestre", v)} />
                    <F label="Tarif mineur — annuel (€)" type="number" value={cp.tarifs?.mineur?.annuel ?? ""} onChange={(v) => updateCP(idx, "tarifs.mineur.annuel", v)} />
                    <div className="ia-grid-full ia-subheading">🟢 Majeur (+18 ans)</div>
                    <F label="Tarif majeur — trimestre (€)" type="number" value={cp.tarifs?.majeur?.trimestre ?? ""} onChange={(v) => updateCP(idx, "tarifs.majeur.trimestre", v)} />
                    <F label="Tarif majeur — annuel (€)" type="number" value={cp.tarifs?.majeur?.annuel ?? ""} onChange={(v) => updateCP(idx, "tarifs.majeur.annuel", v)} />
                  </div>
                  <div className="ia-checkboxes">
                    <C label="Cours en DUO" checked={!!cp.duo} onChange={(v) => updateCP(idx, "duo", v)} />
                    <C label="Inclut FM / Orchestre" checked={!!cp.inclusFM} onChange={(v) => updateCP(idx, "inclusFM", v)} />
                    <C label='Afficher "par élève"' checked={!!cp.noteParEleve} onChange={(v) => updateCP(idx, "noteParEleve", v)} />
                  </div>
                  <TagSelector tags={cp.tags || []} onChange={(newTags) => updateCP(idx, "tags", newTags)} />
                  <button className="ia-btn-save" onClick={() => { save(tarifs); setEditingItem(null); }}>💾 Enregistrer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Pratiques collectives ── */}
      {activeSection === "pc" && (
        <div className="ia-section">
          <div className="ia-section-header">
            <h3>Pratiques collectives</h3>
            <button className="ia-btn-add" onClick={() => setShowNewForm(showNewForm === "pc" ? false : "pc")}>
              {showNewForm === "pc" ? "✕ Fermer" : "➕ Ajouter"}
            </button>
          </div>
          {showNewForm === "pc" && (
            <NouveauPC onAdd={(n) => { save({ ...tarifs, pratiquesCollectives: [...tarifs.pratiquesCollectives, n] }); setShowNewForm(false); }} onCancel={() => setShowNewForm(false)} />
          )}
          {tarifs.pratiquesCollectives.map((pc, idx) => (
            <div key={pc.id} className="ia-card">
              <div className="ia-card-header">
                <strong>{pc.label}</strong>
                <span className="ia-tag blue">{pc.duree} min</span>
                {pc.yogaChorale && <span className="ia-tag pink">Yoga/Chorale</span>}
                <div className="ia-card-actions">
                  <button className="ia-btn-sm" onClick={() => setEditingItem(editingItem === `pc-${idx}` ? null : `pc-${idx}`)}>
                    {editingItem === `pc-${idx}` ? "▲ Fermer" : "✏️ Modifier"}
                  </button>
                  <button className="ia-btn-sm danger" onClick={() => deletePC(idx)}>🗑️</button>
                </div>
              </div>
              {editingItem !== `pc-${idx}` && (
                <div className="ia-card-summary">
                  <span>Âge : {pc.ageMin ?? 0}–{pc.ageMax ?? "∞"} ans</span>
                  <span>Mineur : {pc.tarifs?.mineur?.trimestre}€/trim · {pc.tarifs?.mineur?.annuel}€/an</span>
                  {pc.tarifs?.majeur ? <span>Majeur : {pc.tarifs.majeur.trimestre}€/trim · {pc.tarifs.majeur.annuel}€/an</span> : <span className="ia-na">Majeurs : non disponible</span>}
                  {pc.supplementMateriel > 0 && <span className="ia-tag amber">+{pc.supplementMateriel}€ mat.</span>}
                </div>
              )}
              {editingItem === `pc-${idx}` && (
                <div className="ia-edit-form">
                  <div className="ia-grid">
                    <F label="Label" value={pc.label} onChange={(v) => updatePC(idx, "label", v)} />
                    <F label="Durée (minutes)" type="number" value={pc.duree} onChange={(v) => updatePC(idx, "duree", v)} />
                    <F label="Âge minimum (ans)" type="number" value={pc.ageMin ?? ""} onChange={(v) => updatePC(idx, "ageMin", v)} />
                    <F label="Âge maximum (vide = sans limite)" type="number" value={pc.ageMax ?? ""} onChange={(v) => updatePC(idx, "ageMax", v === "" ? null : v)} />
                    <div className="ia-grid-full ia-subheading">🔵 Tarifs Mineurs (-18 ans)</div>
                    <F label="Tarif mineur — trimestre (€)" type="number" value={pc.tarifs?.mineur?.trimestre ?? ""} onChange={(v) => updatePC(idx, "tarifs.mineur.trimestre", v)} />
                    <F label="Tarif mineur — annuel (€)" type="number" value={pc.tarifs?.mineur?.annuel ?? ""} onChange={(v) => updatePC(idx, "tarifs.mineur.annuel", v)} />
                    <div className="ia-grid-full ia-subheading">🟢 Tarifs Majeurs (+18 ans) — laisser vide si non disponible pour les adultes</div>
                    <F label="Tarif majeur — trimestre (€)" type="number" value={pc.tarifs?.majeur?.trimestre ?? ""} onChange={(v) => {
                      if (!v || v === "") updatePC(idx, "tarifs.majeur", null);
                      else updatePC(idx, "tarifs.majeur.trimestre", v);
                    }} />
                    <F label="Tarif majeur — annuel (€)" type="number" value={pc.tarifs?.majeur?.annuel ?? ""} onChange={(v) => updatePC(idx, "tarifs.majeur.annuel", v)} />
                    <div className="ia-grid-full ia-subheading">⚙️ Options</div>
                    <F label="Supplément matériel / an (€, 0 = aucun)" type="number" value={pc.supplementMateriel ?? 0} onChange={(v) => updatePC(idx, "supplementMateriel", v)} />
                  </div>
                  <div className="ia-checkboxes">
                    <C label="Exclu des réductions multi-activités (Yoga / Chorale)" checked={!!pc.yogaChorale} onChange={(v) => updatePC(idx, "yogaChorale", v)} />
                    <C label="Réduction 33% multi-activités applicable" checked={!!pc.reducDisponible} onChange={(v) => updatePC(idx, "reducDisponible", v)} />
                  </div>
                  <TagSelector tags={pc.tags || []} onChange={(newTags) => updatePC(idx, "tags", newTags)} />
                  <div className="ia-groups-section">
                    <p className="ia-subheading">📋 Groupes d'âge (informatifs, affichés à l'élève)</p>
                    <GroupesEditor groupes={pc.groupes || []} onChange={(g) => updatePC(idx, "groupes", g)} />
                  </div>
                  <button className="ia-btn-save" onClick={() => { save(tarifs); setEditingItem(null); }}>💾 Enregistrer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Instruments ── */}
      {activeSection === "instr" && (
        <div className="ia-section">
          <h3>Instruments disponibles</h3>
          <p className="ia-hint">Ces instruments apparaissent dans la sélection des cours particuliers.</p>
          <div className="instr-grid">
            {tarifs.instruments.map((instr, idx) => (
              <div key={instr.id} className="instr-admin-card">
                <div className="instr-preview-emoji">{instr.emoji}</div>
                <label className="ia-instr-lbl">Emoji</label>
                <input className="ia-instr-inp emoji-inp" value={instr.emoji} onChange={(e) => {
                  const u = { ...tarifs }; u.instruments[idx].emoji = e.target.value; setTarifs({ ...u });
                }} />
                <label className="ia-instr-lbl">Nom</label>
                <input className="ia-instr-inp" value={instr.label} onChange={(e) => {
                  const u = { ...tarifs }; u.instruments[idx].label = e.target.value; setTarifs({ ...u });
                }} />
                <button className="ia-instr-del-btn" onClick={() => {
                  if (!confirm(`Supprimer ${instr.label} ?`)) return;
                  save({ ...tarifs, instruments: tarifs.instruments.filter((_, i) => i !== idx) });
                }}>🗑️ Supprimer</button>
              </div>
            ))}
            <button className="instr-add-card" onClick={() => {
              const u = { ...tarifs, instruments: [...tarifs.instruments, { id: `instr_${Date.now()}`, label: "Nouvel instrument", emoji: "🎵" }] };
              setTarifs(u);
            }}>
              <span className="instr-add-icon">➕</span>
              <span className="instr-add-lbl">Ajouter</span>
            </button>
          </div>
          <button className="ia-btn-save" onClick={() => save(tarifs)}>💾 Enregistrer les instruments</button>
        </div>
      )}

      {/* ── Réductions ── */}
      {activeSection === "reduc" && (
        <div className="ia-section">
          <h3>Réductions &amp; Cotisation</h3>
          <div className="ia-grid">
            <F label="Cotisation annuelle par élève (€)" type="number" value={tarifs.cotisationAnnuelle} onChange={(v) => setTarifs({ ...tarifs, cotisationAnnuelle: Number(v) })} />
            <F label="Réduction foyer (%)" type="number" value={tarifs.reductions.foyer10pct * 100} onChange={(v) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, foyer10pct: Number(v) / 100 } })} />
            <F label="Réduction multi-activités (%) — à partir de la 2e discipline" type="number" value={tarifs.reductions.deuxiemeDiscipline33pct * 100} onChange={(v) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, deuxiemeDiscipline33pct: Number(v) / 100 } })} />
          </div>
          <div className="ia-checkboxes" style={{ marginTop: "1rem" }}>
            <C label="Exclure Yoga et Chorale des réductions multi-activités" checked={tarifs.reductions.exclureYogaChorale} onChange={(v) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, exclureYogaChorale: v } })} />
          </div>
          <div className="ia-rules-box">
            <h4>⚠️ Non-cumul</h4>
            <p>Seule la réduction la plus avantageuse est appliquée par activité. 33% (2e+ discipline) vs 10% foyer → la plus forte s'applique.</p>
          </div>
          <button className="ia-btn-save" onClick={() => save(tarifs)}>💾 Enregistrer</button>
        </div>
      )}

      {activeSection === "inscrits" && <ListeInscrits showMsg={showMsg} />}
      {activeSection === "annees" && <GestionAnnees showMsg={showMsg} />}
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function F({ label, value, onChange, type = "text" }) {
  return (
    <div className="ia-field">
      <label>{label}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function C({ label, checked, onChange }) {
  return (
    <label className="ia-check-label">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function GroupesEditor({ groupes, onChange }) {
  return (
    <div className="groupes-editor">
      {groupes.map((g, i) => (
        <div key={i} className="groupe-row">
          <input placeholder="Nom du groupe (ex: 7-10 ans)" value={g.label} onChange={(e) => { const u = [...groupes]; u[i] = { ...g, label: e.target.value }; onChange(u); }} />
          <input type="number" placeholder="Âge min" value={g.ageMin ?? ""} style={{ width: "75px" }} onChange={(e) => { const u = [...groupes]; u[i] = { ...g, ageMin: Number(e.target.value) }; onChange(u); }} />
          <input type="number" placeholder="Âge max" value={g.ageMax ?? ""} style={{ width: "75px" }} onChange={(e) => { const u = [...groupes]; u[i] = { ...g, ageMax: Number(e.target.value) }; onChange(u); }} />
          <button className="ia-btn-sm danger" onClick={() => onChange(groupes.filter((_, idx) => idx !== i))}>✕</button>
        </div>
      ))}
      <button className="ia-btn-add-small" onClick={() => onChange([...groupes, { label: "", ageMin: 0, ageMax: 18 }])}>➕ Ajouter un groupe d'âge</button>
    </div>
  );
}

// ── Nouveau CP ──
function NouveauCP({ onAdd, onCancel }) {
  const [f, setF] = useState({ id: `cp_${Date.now()}`, label: "", ageMin: 12, ageMax: null, duo: false, inclusFM: false, noteParEleve: false, instruments: [], tarifs: { mineur: { trimestre: 0, annuel: 0 }, majeur: { trimestre: 0, annuel: 0 } } });
  return (
    <div className="ia-card ia-new-card">
      <h4>➕ Nouveau cours particulier</h4>
      <div className="ia-grid">
        <F label="Label" value={f.label} onChange={(v) => setF({ ...f, label: v })} />
        <F label="ID unique" value={f.id} onChange={(v) => setF({ ...f, id: v })} />
        <F label="Âge min" type="number" value={f.ageMin ?? ""} onChange={(v) => setF({ ...f, ageMin: Number(v) })} />
        <F label="Âge max (vide = sans limite)" type="number" value={f.ageMax ?? ""} onChange={(v) => setF({ ...f, ageMax: v === "" ? null : Number(v) })} />
        <div className="ia-grid-full ia-subheading">Tarifs</div>
        <F label="Mineur trim (€)" type="number" value={f.tarifs.mineur.trimestre} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, mineur: { ...f.tarifs.mineur, trimestre: Number(v) } } })} />
        <F label="Mineur annuel (€)" type="number" value={f.tarifs.mineur.annuel} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, mineur: { ...f.tarifs.mineur, annuel: Number(v) } } })} />
        <F label="Majeur trim (€)" type="number" value={f.tarifs.majeur.trimestre} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, majeur: { ...f.tarifs.majeur, trimestre: Number(v) } } })} />
        <F label="Majeur annuel (€)" type="number" value={f.tarifs.majeur.annuel} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, majeur: { ...f.tarifs.majeur, annuel: Number(v) } } })} />
      </div>
      <div className="ia-checkboxes"><C label="DUO" checked={f.duo} onChange={(v) => setF({ ...f, duo: v })} /><C label="+FM/Orchestre" checked={f.inclusFM} onChange={(v) => setF({ ...f, inclusFM: v })} /></div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="ia-btn-save" onClick={() => { if (!f.label) return alert("Label requis"); onAdd(f); }}>✓ Ajouter</button>
        <button className="ia-btn-cancel" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Nouveau PC ──
function NouveauPC({ onAdd, onCancel }) {
  const [f, setF] = useState({ id: `pc_${Date.now()}`, label: "", duree: 60, ageMin: 0, ageMax: null, reducDisponible: true, yogaChorale: false, supplementMateriel: 0, groupes: [], tarifs: { mineur: { trimestre: 0, annuel: 0 }, majeur: null } });
  return (
    <div className="ia-card ia-new-card">
      <h4>➕ Nouvelle pratique collective</h4>
      <div className="ia-grid">
        <F label="Label" value={f.label} onChange={(v) => setF({ ...f, label: v })} />
        <F label="Durée (min)" type="number" value={f.duree} onChange={(v) => setF({ ...f, duree: Number(v) })} />
        <F label="Âge min" type="number" value={f.ageMin ?? ""} onChange={(v) => setF({ ...f, ageMin: Number(v) })} />
        <F label="Âge max" type="number" value={f.ageMax ?? ""} onChange={(v) => setF({ ...f, ageMax: v === "" ? null : Number(v) })} />
        <div className="ia-grid-full ia-subheading">Tarifs Mineurs</div>
        <F label="Mineur trim (€)" type="number" value={f.tarifs.mineur.trimestre} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, mineur: { ...f.tarifs.mineur, trimestre: Number(v) } } })} />
        <F label="Mineur annuel (€)" type="number" value={f.tarifs.mineur.annuel} onChange={(v) => setF({ ...f, tarifs: { ...f.tarifs, mineur: { ...f.tarifs.mineur, annuel: Number(v) } } })} />
        <F label="Supplément matériel/an (€)" type="number" value={f.supplementMateriel} onChange={(v) => setF({ ...f, supplementMateriel: Number(v) })} />
      </div>
      <div className="ia-checkboxes"><C label="Yoga/Chorale (pas de réduction multi-activités)" checked={f.yogaChorale} onChange={(v) => setF({ ...f, yogaChorale: v })} /></div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="ia-btn-save" onClick={() => { if (!f.label) return alert("Label requis"); onAdd(f); }}>✓ Ajouter</button>
        <button className="ia-btn-cancel" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Liste inscrits ──
function ListeInscrits({ showMsg }) {
  const [inscrits, setInscrits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [anneeFilter, setAnneeFilter] = useState("toutes");
  const [annees, setAnnees] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/inscriptions`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/api/annees`).then((r) => r.json()).catch(() => []),
    ]).then(([data, a]) => { setInscrits(data); setAnnees(a); setLoading(false); });
  }, []);

  const filtered = inscrits.filter((ins) => {
    const q = search.toLowerCase();
    const matchSearch = ins.eleves?.some((e) => (e.nom + " " + e.prenom + " " + (e.email || "")).toLowerCase().includes(q));
    const matchAnnee = anneeFilter === "toutes" || ins.annee === anneeFilter;
    return matchSearch && matchAnnee;
  });

  const exportCSV = () => {
    const headers = [
      "Date inscription","Année scolaire","N° dossier","Nb membres foyer","Type paiement","Total foyer (€)",
      "Nom","Prénom","Date naissance","Âge","Sexe","Statut",
      "Adresse","Code postal","Localité","Tél 1","Tél 2","Email",
      "Niveau scolaire","Établissement","Profession",
      "Représentant nom","Représentant prénom","Parenté",
      "Autres membres du foyer",
      "Activité 1","Instrument 1","Prix base 1€","Réduction 1","Prix final 1€",
      "Activité 2","Instrument 2","Prix base 2€","Réduction 2","Prix final 2€",
      "Activité 3","Instrument 3","Prix base 3€","Réduction 3","Prix final 3€",
      "Activité 4","Instrument 4","Prix base 4€","Réduction 4","Prix final 4€",
      "Cotisation€","Supplément matériel€","Total élève€",
      "Droit image","WhatsApp","Assurance","Règlement accepté",
    ];
    const rows = [];
    inscrits.forEach((ins) => {
      const dateIns = new Date(ins.dateInscription).toLocaleDateString("fr-FR");
      (ins.eleves || []).forEach((eleve, ei) => {
        const age = getAge(eleve.dateNaissance);
        const cours = eleve.coursDetails || [];
        const supMat = cours.reduce((s, c) => s + (c.coursData?.supplementMateriel || 0), 0);
        const autresMembres = (ins.eleves || []).filter((_, i) => i !== ei).map((e) => `${e.prenom} ${e.nom}`).join(" | ");
        const row = [
          dateIns, ins.annee || "", ins.id || "", ins.foyer?.nbMembres || 1,
          ins.foyer?.paiementType || "", ins.totalGeneral || "",
          eleve.nom || "", eleve.prenom || "", eleve.dateNaissance || "",
          age ?? "", eleve.sexe || "", age != null ? (age >= 18 ? "Majeur" : "Mineur") : "",
          eleve.adresse || "", eleve.codePostal || "", eleve.localite || "",
          eleve.telPerso || "", eleve.tel2 || "", eleve.email || "",
          eleve.niveauScolaire || "", eleve.etablissement || "", eleve.profession || "",
          eleve.representantNom || "", eleve.representantPrenom || "", eleve.parenté || "",
          autresMembres,
        ];
        for (let i = 0; i < 4; i++) {
          const c = cours[i];
          if (c) row.push(c.coursData?.label || "", c.instrumentId || "", c.prixBase || "", c.reductionAppliquee || "—", c.prixFinal || "");
          else row.push("", "", "", "", "");
        }
        row.push(25, supMat || 0, eleve.totalEleve || "");
        row.push(ins.engagements?.droitImage || "", ins.engagements?.whatsapp ? "Oui" : "Non", ins.engagements?.assurance ? "Oui" : "Non", ins.engagements?.reglement ? "Oui" : "Non");
        rows.push(row);
      });
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inscriptions_${anneeFilter !== "toutes" ? anneeFilter : "toutes"}_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="ia-section">
      <div className="ia-section-header">
        <h3>Inscriptions ({filtered.length}/{inscrits.length})</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="ia-btn-add" onClick={() => exportCSV("toutes")}>⬇️ Export CSV complet</button>
          {annees.map((a) => (
            <button key={a} className="ia-btn-sm" onClick={() => exportCSV(a)}>⬇️ {a}</button>
          ))}
        </div>
      </div>
      <div className="ia-filters">
        <input className="ia-search" style={{ flex: 1 }} placeholder="Rechercher par nom, prénom, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="ia-select" value={anneeFilter} onChange={(e) => setAnneeFilter(e.target.value)}>
          <option value="toutes">Toutes les années</option>
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {loading && <p>Chargement…</p>}
      {!loading && filtered.length === 0 && <p className="ia-hint">Aucune inscription trouvée.</p>}
      {filtered.map((ins, i) => (
        <div key={i} className={`ia-card ${ins.statut === "valide" ? "ia-card-valide" : ""}`}>
          <div className="ia-card-header">
            <div style={{ flex: 1 }}>
              <strong>{ins.eleves?.map((e) => `${e.prenom} ${e.nom}`).join(" · ")}</strong>
              <span className="ia-date"> — {new Date(ins.dateInscription).toLocaleDateString("fr-FR")}</span>
              {ins.annee && <span className="ia-tag blue" style={{ marginLeft: "0.5rem" }}>{ins.annee}</span>}
              {ins.statut === "valide"
                ? <span className="ia-tag green" style={{ marginLeft: "0.5rem" }}>✅ Validée</span>
                : <span className="ia-tag amber" style={{ marginLeft: "0.5rem" }}>⏳ En attente</span>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="total-badge">{ins.totalGeneral} €</span>
              {ins.statut !== "valide" && (
                <button className="ia-btn-valider" onClick={async () => {
                  if (!confirm(`Valider l'inscription de ${ins.eleves?.map((e) => e.prenom).join(", ")} ? L'inscrit ne pourra plus la modifier en ligne.`)) return;
                  const res = await fetch(`${API}/api/inscriptions/${ins.id}/valider`, { method: "PUT" });
                  if (res.ok) {
                    setInscrits((p) => p.map((x) => x.id === ins.id ? { ...x, statut: "valide" } : x));
                    showMsg("✅ Inscription validée.");
                  } else showMsg("❌ Erreur lors de la validation.");
                }}>✅ Valider</button>
              )}
              <button className="ia-btn-sm" onClick={() => setExpanded(expanded === i ? null : i)}>{expanded === i ? "▲" : "▼"}</button>
              <button className="ia-btn-sm danger" onClick={async () => {
                if (!confirm("Supprimer ?")) return;
                await fetch(`${API}/api/inscriptions/${ins.id}`, { method: "DELETE" });
                setInscrits((p) => p.filter((x) => x.id !== ins.id));
                showMsg("🗑️ Supprimé.");
              }}>🗑️</button>
            </div>
          </div>
          {expanded === i && (
            <div className="ia-inscr-detail">
              {ins.eleves?.map((eleve, ei) => (
                <div key={ei} className="ia-eleve-detail">
                  <h5>{eleve.prenom} {eleve.nom} — {getAge(eleve.dateNaissance)} ans · {eleve.email}</h5>
                  {eleve.representantNom && <p className="ia-repr">Représentant : {eleve.representantNom} {eleve.representantPrenom} ({eleve.parenté})</p>}
                  <div className="ia-cours-list">
                    {eleve.coursDetails?.map((c, ci) => (
                      <span key={ci} className="ia-cours-chip">
                        {c.instrumentId && <strong>{c.instrumentId} — </strong>}{c.coursData?.label}
                        {c.reductionAppliquee && <span className="ia-reduc"> −{c.reductionAppliquee}</span>}
                        <strong> → {c.prixFinal}€</strong>
                      </span>
                    ))}
                  </div>
                  <p className="ia-total-eleve">Total : <strong>{eleve.totalEleve} €</strong> (cotisation 25€ incluse)</p>
                </div>
              ))}
              <p className="ia-engag">Image : {ins.engagements?.droitImage || "?"} · WhatsApp : {ins.engagements?.whatsapp ? "✓" : "✗"} · Assurance : {ins.engagements?.assurance ? "✓" : "✗"} · Règlement : {ins.engagements?.reglement ? "✓" : "✗"}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Gestion années scolaires ──
function GestionAnnees({ showMsg }) {
  const [annees, setAnnees] = useState([]);
  const [anneeCourante, setAnneeCourante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAnnee, setNewAnnee] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/annees`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/api/annee-courante`).then((r) => r.json()).catch(() => ({ annee: null })),
    ]).then(([a, c]) => { setAnnees(a); setAnneeCourante(c.annee); setLoading(false); });
  }, []);

  const creer = async () => {
    if (!newAnnee.trim()) return;
    const res = await fetch(`${API}/api/annees`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ annee: newAnnee.trim() }) });
    if (res.ok) { const d = await res.json(); setAnnees(d.annees); showMsg(`✅ Année ${newAnnee} créée`); }
    else showMsg("❌ Erreur");
  };

  const activer = async (a) => {
    const res = await fetch(`${API}/api/annee-courante`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ annee: a }) });
    if (res.ok) { setAnneeCourante(a); showMsg(`✅ Année courante : ${a}`); }
  };

  const archiver = async () => {
    if (!anneeCourante) return alert("Aucune année courante.");
    if (!confirm(`Archiver les inscriptions de ${anneeCourante} ?`)) return;
    const res = await fetch(`${API}/api/inscriptions/archiver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ annee: anneeCourante }) });
    if (res.ok) showMsg(`✅ Inscriptions ${anneeCourante} archivées.`);
    else showMsg("❌ Erreur archivage.");
  };

  if (loading) return <p>Chargement…</p>;

  return (
    <div className="ia-section">
      <h3>Années scolaires</h3>
      <div className="annee-courante-box">
        <h4>Année active</h4>
        <p className="annee-active-label">{anneeCourante || "Aucune"}</p>
        <p className="ia-hint">Les nouvelles inscriptions sont rattachées à cette année.</p>
      </div>
      <div className="ia-card" style={{ marginBottom: "1rem" }}>
        <h4>Créer une nouvelle année</h4>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input className="ia-search" style={{ margin: 0, flex: 1, minWidth: "180px" }} placeholder="Ex : 2026-2027" value={newAnnee} onChange={(e) => setNewAnnee(e.target.value)} />
          <button className="ia-btn-save" style={{ margin: 0 }} onClick={creer}>Créer</button>
        </div>
      </div>
      {annees.map((a) => (
        <div key={a} className={`ia-card annee-row ${a === anneeCourante ? "annee-active" : ""}`}>
          <strong>{a}</strong>
          {a === anneeCourante && <span className="ia-tag green">Active</span>}
          <div className="ia-card-actions">
            {a !== anneeCourante && <button className="ia-btn-sm" onClick={() => activer(a)}>▶ Activer</button>}
            {a === anneeCourante && <button className="ia-btn-sm danger" onClick={archiver}>📦 Archiver les inscrits</button>}
          </div>
        </div>
      ))}
      <div className="ia-rules-box" style={{ marginTop: "1.5rem" }}>
        <h4>💡 Procédure changement d'année</h4>
        <p>1. Créer la nouvelle année (ex: 2026-2027)<br />2. Archiver les inscriptions de l'année courante si souhaité<br />3. Activer la nouvelle année → toutes les nouvelles inscriptions lui seront rattachées<br />4. Les archives restent consultables dans Inscrits en filtrant par année</p>
      </div>
    </div>
  );
}

function getAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() - dob.getMonth() < 0 || (now.getMonth() - dob.getMonth() === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
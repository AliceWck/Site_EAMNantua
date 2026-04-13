import { useState, useEffect } from "react";
import "./InscriptionAdmin.css";

const API = import.meta.env.VITE_API_URL;

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
      if (res.ok) {
        setTarifs(newTarifs);
        showMsg("✅ Tarifs mis à jour !");
      } else {
        showMsg("❌ Erreur lors de la sauvegarde.");
      }
    } catch {
      showMsg("❌ Erreur réseau.");
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateCP = (idx, field, value) => {
    const updated = { ...tarifs };
    const path = field.split(".");
    let target = updated.coursParticuliers[idx];
    for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
    target[path[path.length - 1]] = isNaN(value) ? value : (value === "" ? "" : Number(value));
    setTarifs({ ...updated });
  };

  const updatePC = (idx, field, value) => {
    const updated = { ...tarifs };
    const path = field.split(".");
    let target = updated.pratiquesCollectives[idx];
    for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
    const finalVal = value === "true" ? true : value === "false" ? false : (isNaN(value) || value === "" ? value : Number(value));
    target[path[path.length - 1]] = finalVal;
    setTarifs({ ...updated });
  };

  const deleteCP = (idx) => {
    if (!confirm("Supprimer ce cours particulier ?")) return;
    const updated = { ...tarifs, coursParticuliers: tarifs.coursParticuliers.filter((_, i) => i !== idx) };
    save(updated);
  };

  const deletePC = (idx) => {
    if (!confirm("Supprimer cette pratique collective ?")) return;
    const updated = { ...tarifs, pratiquesCollectives: tarifs.pratiquesCollectives.filter((_, i) => i !== idx) };
    save(updated);
  };

  const deleteInstr = (idx) => {
    if (!confirm("Supprimer cet instrument ?")) return;
    const updated = { ...tarifs, instruments: tarifs.instruments.filter((_, i) => i !== idx) };
    save(updated);
  };

  if (!tarifs) return <div className="ia-loading">Chargement…</div>;

  return (
    <div className="inscr-admin">
      <h2>📋 Gestion des tarifs & cours</h2>

      <div className="ia-tabs">
        {[
          { id: "cp", label: "🎵 Cours particuliers" },
          { id: "pc", label: "🎭 Pratiques collectives" },
          { id: "instr", label: "🎸 Instruments" },
          { id: "reduc", label: "💸 Réductions & cotisation" },
          { id: "inscrits", label: "📊 Liste des inscrits" },
        ].map((t) => (
          <button
            key={t.id}
            className={`ia-tab ${activeSection === t.id ? "active" : ""}`}
            onClick={() => setActiveSection(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="ia-message">{message}</div>}

      {/* --------- Cours particuliers --------- */}
      {activeSection === "cp" && (
        <div className="ia-section">
          <div className="ia-section-header">
            <h3>Cours particuliers d'instruments</h3>
            <button className="ia-btn-add" onClick={() => setShowNewForm("cp")}>➕ Ajouter</button>
          </div>

          {tarifs.coursParticuliers.map((cp, idx) => (
            <div key={cp.id} className="ia-card">
              <div className="ia-card-header">
                <strong>{cp.label}</strong>
                <div className="ia-card-actions">
                  <button className="ia-btn-sm" onClick={() => setEditingItem(editingItem === `cp-${idx}` ? null : `cp-${idx}`)}>
                    {editingItem === `cp-${idx}` ? "Fermer" : "✏️ Modifier"}
                  </button>
                  <button className="ia-btn-sm danger" onClick={() => deleteCP(idx)}>🗑️</button>
                </div>
              </div>

              {editingItem === `cp-${idx}` && (
                <div className="ia-edit-form">
                  <div className="ia-grid">
                    <div className="ia-field">
                      <label>Label</label>
                      <input value={cp.label} onChange={(e) => updateCP(idx, "label", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>ID (unique, pas d'espace)</label>
                      <input value={cp.id} onChange={(e) => updateCP(idx, "id", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Âge minimum</label>
                      <input type="number" value={cp.ageMin ?? ""} onChange={(e) => updateCP(idx, "ageMin", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Âge maximum (vide = aucun)</label>
                      <input type="number" value={cp.ageMax ?? ""} onChange={(e) => updateCP(idx, "ageMax", e.target.value === "" ? null : e.target.value)} />
                    </div>

                    <div className="ia-field">
                      <label>🔵 Tarif mineur — trimestre (€)</label>
                      <input type="number" value={cp.tarifs?.mineur?.trimestre ?? ""} onChange={(e) => updateCP(idx, "tarifs.mineur.trimestre", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🔵 Tarif mineur — annuel (€)</label>
                      <input type="number" value={cp.tarifs?.mineur?.annuel ?? ""} onChange={(e) => updateCP(idx, "tarifs.mineur.annuel", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🟢 Tarif majeur — trimestre (€)</label>
                      <input type="number" value={cp.tarifs?.majeur?.trimestre ?? ""} onChange={(e) => updateCP(idx, "tarifs.majeur.trimestre", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🟢 Tarif majeur — annuel (€)</label>
                      <input type="number" value={cp.tarifs?.majeur?.annuel ?? ""} onChange={(e) => updateCP(idx, "tarifs.majeur.annuel", e.target.value)} />
                    </div>

                    <div className="ia-field ia-checkbox">
                      <label>
                        <input type="checkbox" checked={cp.duo} onChange={(e) => updateCP(idx, "duo", e.target.checked)} />
                        Cours en DUO
                      </label>
                    </div>
                    <div className="ia-field ia-checkbox">
                      <label>
                        <input type="checkbox" checked={cp.inclusFM} onChange={(e) => updateCP(idx, "inclusFM", e.target.checked)} />
                        Inclut FM/Orchestre
                      </label>
                    </div>
                    <div className="ia-field ia-checkbox">
                      <label>
                        <input type="checkbox" checked={cp.noteParEleve} onChange={(e) => updateCP(idx, "noteParEleve", e.target.checked)} />
                        Tarif "par élève"
                      </label>
                    </div>
                  </div>
                  <button className="ia-btn-save" onClick={() => { save(tarifs); setEditingItem(null); }}>
                    💾 Enregistrer ce cours
                  </button>
                </div>
              )}

              {editingItem !== `cp-${idx}` && (
                <div className="ia-card-summary">
                  <span>Âge : {cp.ageMin ?? "∞"}–{cp.ageMax ?? "∞"}</span>
                  <span>Mineur : {cp.tarifs?.mineur?.trimestre}€/trim · {cp.tarifs?.mineur?.annuel}€/an</span>
                  <span>Majeur : {cp.tarifs?.majeur?.trimestre}€/trim · {cp.tarifs?.majeur?.annuel}€/an</span>
                  {cp.duo && <span className="tag">DUO</span>}
                  {cp.inclusFM && <span className="tag green">+FM</span>}
                </div>
              )}
            </div>
          ))}

          {showNewForm === "cp" && (
            <NouveauCP
              onAdd={(newCP) => {
                const updated = { ...tarifs, coursParticuliers: [...tarifs.coursParticuliers, newCP] };
                save(updated);
                setShowNewForm(false);
              }}
              onCancel={() => setShowNewForm(false)}
            />
          )}
        </div>
      )}

      {/* ------------ Pratiques collectives -------------- */}
      {activeSection === "pc" && (
        <div className="ia-section">
          <div className="ia-section-header">
            <h3>Pratiques collectives</h3>
            <button className="ia-btn-add" onClick={() => setShowNewForm("pc")}>➕ Ajouter</button>
          </div>

          {tarifs.pratiquesCollectives.map((pc, idx) => (
            <div key={pc.id} className="ia-card">
              <div className="ia-card-header">
                <strong>{pc.label}</strong>
                <span className="tag">{pc.duree} min</span>
                <div className="ia-card-actions">
                  <button className="ia-btn-sm" onClick={() => setEditingItem(editingItem === `pc-${idx}` ? null : `pc-${idx}`)}>
                    {editingItem === `pc-${idx}` ? "Fermer" : "✏️ Modifier"}
                  </button>
                  <button className="ia-btn-sm danger" onClick={() => deletePC(idx)}>🗑️</button>
                </div>
              </div>

              {editingItem === `pc-${idx}` && (
                <div className="ia-edit-form">
                  <div className="ia-grid">
                    <div className="ia-field">
                      <label>Label</label>
                      <input value={pc.label} onChange={(e) => updatePC(idx, "label", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Durée (minutes)</label>
                      <input type="number" value={pc.duree} onChange={(e) => updatePC(idx, "duree", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Âge minimum</label>
                      <input type="number" value={pc.ageMin ?? ""} onChange={(e) => updatePC(idx, "ageMin", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Âge maximum (vide = aucun)</label>
                      <input type="number" value={pc.ageMax ?? ""} onChange={(e) => updatePC(idx, "ageMax", e.target.value === "" ? "" : e.target.value)} />
                    </div>

                    <div className="ia-field">
                      <label>🔵 Tarif mineur — trimestre (€)</label>
                      <input type="number" value={pc.tarifs?.mineur?.trimestre ?? ""} onChange={(e) => updatePC(idx, "tarifs.mineur.trimestre", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🔵 Tarif mineur — annuel (€)</label>
                      <input type="number" value={pc.tarifs?.mineur?.annuel ?? ""} onChange={(e) => updatePC(idx, "tarifs.mineur.annuel", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🟢 Tarif majeur — trimestre (€) (vide si non disponible)</label>
                      <input type="number" value={pc.tarifs?.majeur?.trimestre ?? ""} onChange={(e) => updatePC(idx, "tarifs.majeur.trimestre", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>🟢 Tarif majeur — annuel (€)</label>
                      <input type="number" value={pc.tarifs?.majeur?.annuel ?? ""} onChange={(e) => updatePC(idx, "tarifs.majeur.annuel", e.target.value)} />
                    </div>
                    <div className="ia-field">
                      <label>Supplément matériel/an (€, 0 = aucun)</label>
                      <input type="number" value={pc.supplementMateriel ?? 0} onChange={(e) => updatePC(idx, "supplementMateriel", e.target.value)} />
                    </div>

                    <div className="ia-field ia-checkbox">
                      <label>
                        <input type="checkbox" checked={pc.yogaChorale} onChange={(e) => updatePC(idx, "yogaChorale", e.target.checked)} />
                        Exclu des réductions multi-activités (Yoga / Chorale)
                      </label>
                    </div>
                    <div className="ia-field ia-checkbox">
                      <label>
                        <input type="checkbox" checked={pc.reducDisponible} onChange={(e) => updatePC(idx, "reducDisponible", e.target.checked)} />
                        Réduction 33% applicable
                      </label>
                    </div>
                  </div>
                  <button className="ia-btn-save" onClick={() => { save(tarifs); setEditingItem(null); }}>
                    💾 Enregistrer
                  </button>
                </div>
              )}

              {editingItem !== `pc-${idx}` && (
                <div className="ia-card-summary">
                  <span>Âge : {pc.ageMin ?? "∞"}–{pc.ageMax ?? "∞"}</span>
                  <span>Mineur : {pc.tarifs?.mineur?.trimestre}€/trim · {pc.tarifs?.mineur?.annuel}€/an</span>
                  {pc.tarifs?.majeur && <span>Majeur : {pc.tarifs.majeur.trimestre}€/trim · {pc.tarifs.majeur.annuel}€/an</span>}
                  {pc.supplementMateriel && <span className="tag">+{pc.supplementMateriel}€ mat.</span>}
                  {pc.yogaChorale && <span className="tag pink">Yoga/Chorale</span>}
                </div>
              )}
            </div>
          ))}

          {showNewForm === "pc" && (
            <NouveauPC
              onAdd={(newPC) => {
                const updated = { ...tarifs, pratiquesCollectives: [...tarifs.pratiquesCollectives, newPC] };
                save(updated);
                setShowNewForm(false);
              }}
              onCancel={() => setShowNewForm(false)}
            />
          )}
        </div>
      )}

      {/* --- Instruments --- */}
      {activeSection === "instr" && (
        <div className="ia-section">
          <h3>Instruments disponibles</h3>
          <p className="ia-hint">Ces instruments apparaissent dans la sélection des cours particuliers.</p>

          <div className="instr-grid">
            {tarifs.instruments.map((instr, idx) => (
              <div key={instr.id} className="instr-admin-card">
                <div className="instr-admin-emoji">{instr.emoji}</div>
                <div className="ia-field">
                  <label>Emoji</label>
                  <input value={instr.emoji} style={{ width: "60px", textAlign: "center" }}
                    onChange={(e) => {
                      const updated = { ...tarifs };
                      updated.instruments[idx].emoji = e.target.value;
                      setTarifs({ ...updated });
                    }}
                  />
                </div>
                <div className="ia-field">
                  <label>Nom</label>
                  <input value={instr.label}
                    onChange={(e) => {
                      const updated = { ...tarifs };
                      updated.instruments[idx].label = e.target.value;
                      setTarifs({ ...updated });
                    }}
                  />
                </div>
                <button className="ia-btn-sm danger" onClick={() => deleteInstr(idx)}>🗑️</button>
              </div>
            ))}

            <button className="instr-add-btn" onClick={() => {
              const updated = { ...tarifs, instruments: [...tarifs.instruments, { id: `instr_${Date.now()}`, label: "Nouvel instrument", emoji: "🎵" }] };
              setTarifs(updated);
            }}>➕</button>
          </div>

          <button className="ia-btn-save" onClick={() => save(tarifs)}>💾 Enregistrer les instruments</button>
        </div>
      )}

      {/* --- Réductions --- */}
      {activeSection === "reduc" && (
        <div className="ia-section">
          <h3>Réductions & Cotisation</h3>

          <div className="ia-grid">
            <div className="ia-field">
              <label>Cotisation annuelle par élève (€)</label>
              <input
                type="number"
                value={tarifs.cotisationAnnuelle}
                onChange={(e) => setTarifs({ ...tarifs, cotisationAnnuelle: Number(e.target.value) })}
              />
            </div>
            <div className="ia-field">
              <label>Réduction foyer (%) — par activité pour membres d'un même foyer</label>
              <input
                type="number"
                value={tarifs.reductions.foyer10pct * 100}
                onChange={(e) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, foyer10pct: Number(e.target.value) / 100 } })}
              />
            </div>
            <div className="ia-field">
              <label>Réduction multi-activités (%) — à partir de la 2e discipline</label>
              <input
                type="number"
                value={tarifs.reductions.deuxiemeDiscipline33pct * 100}
                onChange={(e) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, deuxiemeDiscipline33pct: Number(e.target.value) / 100 } })}
              />
            </div>
          </div>

          <div className="ia-field ia-checkbox" style={{ marginTop: "1rem" }}>
            <label>
              <input
                type="checkbox"
                checked={tarifs.reductions.exclureYogaChorale}
                onChange={(e) => setTarifs({ ...tarifs, reductions: { ...tarifs.reductions, exclureYogaChorale: e.target.checked } })}
              />
              Exclure Yoga et Chorale de la réduction multi-activités
            </label>
          </div>

          <div className="ia-rules-box">
            <h4>⚠️ Règle de non-cumul (appliquée automatiquement)</h4>
            <p>Seule la réduction la plus avantageuse est appliquée par activité. La réduction 33% (2e discipline+) est comparée à la réduction foyer 10%, et la plus forte s'applique.</p>
          </div>

          <button className="ia-btn-save" onClick={() => save(tarifs)}>💾 Enregistrer</button>
        </div>
      )}

      {/* ── Liste inscrits ── */}
      {activeSection === "inscrits" && <ListeInscrits />}
    </div>
  );
}

// ------------ Nouveau cours particulier ------------
function NouveauCP({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    id: `cp_${Date.now()}`,
    label: "",
    ageMin: 12,
    ageMax: null,
    duo: false,
    inclusFM: false,
    noteParEleve: false,
    instruments: ["piano", "guitare", "violon", "alto", "batterie", "flute", "trompette", "clarinette", "chant"],
    tarifs: { mineur: { trimestre: 0, annuel: 0 }, majeur: { trimestre: 0, annuel: 0 } },
  });

  return (
    <div className="ia-card ia-new-card">
      <h4>Nouveau cours particulier</h4>
      <div className="ia-grid">
        <div className="ia-field"><label>Label</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        <div className="ia-field"><label>ID unique</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} /></div>
        <div className="ia-field"><label>Âge min</label><input type="number" value={form.ageMin ?? ""} onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })} /></div>
        <div className="ia-field"><label>Tarif mineur trim (€)</label><input type="number" value={form.tarifs.mineur.trimestre} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, mineur: { ...form.tarifs.mineur, trimestre: Number(e.target.value) } } })} /></div>
        <div className="ia-field"><label>Tarif mineur annuel (€)</label><input type="number" value={form.tarifs.mineur.annuel} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, mineur: { ...form.tarifs.mineur, annuel: Number(e.target.value) } } })} /></div>
        <div className="ia-field"><label>Tarif majeur trim (€)</label><input type="number" value={form.tarifs.majeur.trimestre} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, majeur: { ...form.tarifs.majeur, trimestre: Number(e.target.value) } } })} /></div>
        <div className="ia-field"><label>Tarif majeur annuel (€)</label><input type="number" value={form.tarifs.majeur.annuel} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, majeur: { ...form.tarifs.majeur, annuel: Number(e.target.value) } } })} /></div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="ia-btn-save" onClick={() => onAdd(form)}>✓ Ajouter</button>
        <button className="ia-btn-cancel" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ------------ Nouveau pratique collective ------------
function NouveauPC({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    id: `pc_${Date.now()}`,
    label: "",
    duree: 60,
    ageMin: 0,
    ageMax: null,
    reducDisponible: true,
    yogaChorale: false,
    supplementMateriel: 0,
    tarifs: { mineur: { trimestre: 0, annuel: 0 }, majeur: null },
  });

  return (
    <div className="ia-card ia-new-card">
      <h4>Nouvelle pratique collective</h4>
      <div className="ia-grid">
        <div className="ia-field"><label>Label</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        <div className="ia-field"><label>Durée (min)</label><input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: Number(e.target.value) })} /></div>
        <div className="ia-field"><label>Âge min</label><input type="number" value={form.ageMin ?? ""} onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })} /></div>
        <div className="ia-field"><label>Tarif mineur trim (€)</label><input type="number" value={form.tarifs.mineur.trimestre} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, mineur: { ...form.tarifs.mineur, trimestre: Number(e.target.value) } } })} /></div>
        <div className="ia-field"><label>Tarif mineur annuel (€)</label><input type="number" value={form.tarifs.mineur.annuel} onChange={(e) => setForm({ ...form, tarifs: { ...form.tarifs, mineur: { ...form.tarifs.mineur, annuel: Number(e.target.value) } } })} /></div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="ia-btn-save" onClick={() => onAdd(form)}>✓ Ajouter</button>
        <button className="ia-btn-cancel" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ------------ Liste des inscrits ------------
function ListeInscrits() {
  const [inscrits, setInscrits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/api/inscriptions`)
      .then((r) => r.json())
      .then((data) => { setInscrits(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = inscrits.filter((ins) => {
    const q = search.toLowerCase();
    return ins.eleves?.some((e) =>
      e.nom?.toLowerCase().includes(q) || e.prenom?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const rows = [
      ["Date", "Nb élèves", "Total (€)", "Paiement", "Noms"].join(";"),
      ...inscrits.map((ins) => [
        new Date(ins.dateInscription).toLocaleDateString("fr-FR"),
        ins.eleves?.length ?? "",
        ins.totalGeneral ?? "",
        ins.foyer?.paiementType ?? "",
        ins.eleves?.map((e) => `${e.nom} ${e.prenom}`).join(" / ") ?? "",
      ].join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscriptions_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="ia-section">
      <div className="ia-section-header">
        <h3>Inscriptions reçues ({inscrits.length})</h3>
        <button className="ia-btn-add" onClick={exportCSV}>⬇️ Exporter CSV</button>
      </div>

      <input
        className="ia-search"
        placeholder="Rechercher par nom…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Chargement…</p>}
      {!loading && filtered.length === 0 && <p className="ia-hint">Aucune inscription trouvée.</p>}

      {filtered.map((ins, i) => (
        <div key={i} className="ia-card">
          <div className="ia-card-header">
            <div>
              <strong>
                {ins.eleves?.map((e) => `${e.prenom} ${e.nom}`).join(" · ")}
              </strong>
              <span className="ia-date"> — {new Date(ins.dateInscription).toLocaleDateString("fr-FR")}</span>
            </div>
            <span className="total-badge">{ins.totalGeneral} €</span>
          </div>
          <div className="ia-card-summary">
            <span>{ins.foyer?.nbMembres} élève(s)</span>
            <span>Paiement {ins.foyer?.paiementType}</span>
            {ins.eleves?.map((e, ei) => (
              <span key={ei} className="eleve-mini">
                {e.prenom} {e.nom} ({e.dateNaissance}) ·{" "}
                {e.coursDetails?.map((c) => c.coursData?.label).join(", ")}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "secret123";

const dataDir = path.join(__dirname, "..", "public", "data");
const formulairesFilePath = path.join(dataDir, "formulaires.json");

if (!fs.existsSync(formulairesFilePath)) {
  fs.writeFileSync(formulairesFilePath, JSON.stringify([], null, 2));
}


app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).json({ message: "Connexion réussie" });
  } else {
    res.status(401).json({ message: "Identifiants incorrects" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend EAM opérationnel 🎉");
});



let contactInfo = {
  email: "contact@example.com",
  phone: "0123456789",
};

let notesArray = [
  { id: 1, title: "Note A", content: "Contenu A", date: "2024-05-01" },
  { id: 2, title: "Note B", content: "Contenu B", date: "2024-05-10" },
];




/////////// CONTACT
// Route GET pour récupérer les infos de contact
app.get("/api/contact", (req, res) => {
  res.json(contactInfo);
});

// Route PUT pour mettre à jour les infos de contact
app.put("/api/contact", (req, res) => {
  const { email, phone } = req.body;
  contactInfo = { email, phone };
  res.status(200).json({ message: "Contact mis à jour" });
});





//////////// NOTES
// GET /api/notes événement
app.get("/api/notes", (req, res) => {
    res.json(notesArray); // Ex: récupérer depuis une BDD ou un fichier
});

// POST /api/notes événement
app.post("/api/notes", (req, res) => {
    const { title, content, date } = req.body;
    const newNote = { id: Date.now(), title, content, date: date || new Date().toISOString().split("T")[0],};
    notesArray.push(newNote);
    res.json(newNote);
});

// DELETE /api/notes/:id
app.delete("/api/notes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = notesArray.length;
  notesArray = notesArray.filter((note) => note.id !== id);

  if (notesArray.length < initialLength) {
    res.status(200).json({ message: "Note supprimée" });
  } else {
    res.status(404).json({ message: "Note non trouvée" });
  }
});


// Notes — REORDER
app.post("/api/notes/reorder", (req, res) => {
  const newOrder = req.body;
  if (Array.isArray(newOrder)) {
    notesArray = newOrder;
    res.status(200).json({ message: "Ordre des notes mis à jour" });
  } else {
    res.status(400).json({ message: "Format invalide" });
  }
});


///////////// FORMULAIRES

// GET tous les formulaires
app.get("/api/formulaires", (req, res) => {
  const data = loadFormulaires();
  res.json(data);
});


// Helper: charger depuis fichier
function loadFormulaires() {
  const raw = fs.readFileSync(formulairesFilePath, "utf-8");
  return JSON.parse(raw);
}

// Helper: sauvegarder vers fichier
function saveFormulaires(data) {
  fs.writeFileSync(formulairesFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// POST - Ajouter un formulaire
app.post("/api/formulaires", (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) return res.status(400).json({ message: "Nom et URL requis" });

  const formulaires = loadFormulaires();
  const newForm = { id: Date.now(), name, url };
  formulaires.push(newForm);
  saveFormulaires(formulaires);

  res.status(201).json(newForm);
});

// DELETE - Supprimer un formulaire
app.delete("/api/formulaires/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const formulaires = loadFormulaires();
  const index = formulaires.findIndex((f) => f.id === id);
  if (index === -1) return res.status(404).json({ message: "Formulaire non trouvé" });

  formulaires.splice(index, 1);
  saveFormulaires(formulaires);
  res.status(200).json({ message: "Formulaire supprimé" });

});

// PUT - Modifier un formulaire
app.put("/api/formulaires/batch", (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: "Format attendu : tableau d’objets {id, name, url}" });
  }

  saveFormulaires(updates); // Remplace tout
  res.status(200).json({ message: `Tous les formulaires ont été enregistrés (${updates.length})` });
});




app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);
  res.status(500).json({ message: "Erreur serveur interne" });
});



app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "secret123";

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

app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});

// Données fictives à exposer
let formulaires = [
  { id: 1, nom: "Formulaire 1", contenu: "Contenu du formulaire 1" },
  { id: 2, nom: "Formulaire 2", contenu: "Contenu du formulaire 2" },
];

let contactInfo = {
  email: "contact@example.com",
  phone: "0123456789",
};

// Route GET pour récupérer les formulaires
app.get("/api/formulaires", (req, res) => {
  res.json(formulaires);
});

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
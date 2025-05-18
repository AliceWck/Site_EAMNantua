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

const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const multer = require("multer");

// Dossier de destination pour les images
const uploadDir = path.join(__dirname, "..", "public", "images", "equipe");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurer multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nettoyer le nom du fichier pour éviter les conflits
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});

const uploadEquipe = multer({ storage });
const uploadTemp = multer({ dest: "temp_uploads/" }); // pour les galeries



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

const photosJsonPath = path.join(dataDir, "photos.json");
if (!fs.existsSync(photosJsonPath)) {
  fs.writeFileSync(photosJsonPath, JSON.stringify([], null, 2));
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



let notesArray = [
  { id: 1, title: "Note A", content: "Contenu A", date: "2024-05-01" },
  { id: 2, title: "Note B", content: "Contenu B", date: "2024-05-10" },
];




/////////// CONTACT
const contactFilePath = path.join(dataDir, "contact.json");

if (!fs.existsSync(contactFilePath)) {
  fs.writeFileSync(contactFilePath, JSON.stringify({ email: "", phone: "" }, null, 2));
}

// Helper pour lire/écrire les contacts
function loadContact() {
  const raw = fs.readFileSync(contactFilePath, "utf-8");
  return JSON.parse(raw);
}

function saveContact(data) {
  fs.writeFileSync(contactFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// GET : lire les infos de contact depuis contact.json
app.get("/api/contact", (req, res) => {
  try {
    const contact = loadContact();
    res.json(contact);
  } catch (err) {
    console.error("Erreur lecture contact :", err);
    res.status(500).json({ message: "Erreur de lecture des informations de contact" });
  }
});

// PUT : mettre à jour les infos de contact dans contact.json
app.put("/api/contact", (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) return res.status(400).json({ message: "Email et téléphone requis" });

  try {
    const updated = { email, phone };
    saveContact(updated);
    res.status(200).json({ message: "Contact mis à jour" });
  } catch (err) {
    console.error("Erreur sauvegarde contact :", err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement des contacts" });
  }
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

  if (!Array.isArray(newOrder)) {
    return res.status(400).json({ message: "Format invalide (tableau attendu)" });
  }

  try {
    saveNotes(newOrder);
    res.status(200).json({ message: "Ordre des notes mis à jour" });
  } catch (err) {
    console.error("Erreur enregistrement ordre notes :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




//////////// PHOTOS
const galleriesFilePath = path.join(dataDir, "photos.json");

const loadGalleries = async () => {
  try {
    const data = await fs.promises.readFile(galleriesFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveGalleries = async (data) => {
  await fs.promises.writeFile(galleriesFilePath, JSON.stringify(data, null, 2));
};



// GET - liste des galeries
app.get("/api/galleries", async (req, res) => {
  const galleries = await loadGalleries();
  res.json(galleries);
});

// POST - ajouter une nouvelle galerie
app.post("/api/galleries", async (req, res) => {
  const galleries = await loadGalleries();
  const { id, title } = req.body;

  if (galleries.find((g) => g.id === id)) {
    return res.status(400).json({ error: "ID already exists" });
  }

  const newGallery = { id, title, images: [] };
  galleries.push(newGallery);
  await saveGalleries(galleries);
  res.json(newGallery);
});

// POST - ajouter une image par URL
app.post("/api/galleries/:id/add-url", async (req, res) => {
  const galleries = await loadGalleries();
  const gallery = galleries.find((g) => g.id === req.params.id);
  if (!gallery) return res.status(404).json({ error: "Gallery not found" });

  gallery.images.push(req.body.url);
  await saveGalleries(galleries);
  res.json(gallery);
});

// POST - upload image locale
app.post("/api/galleries/:id/upload", uploadTemp.single("photo"), async (req, res) => {
  const galleries = await loadGalleries();
  const gallery = galleries.find((g) => g.id === req.params.id);
  if (!gallery) return res.status(404).json({ error: "Gallery not found" });

  const ext = path.extname(req.file.originalname);
  const newFileName = Date.now() + ext;
  const galleryDir = path.join(__dirname, "..", "public", "images", "photos", gallery.id);
  const finalPath = path.join(galleryDir, newFileName);

  await fs.ensureDir(galleryDir);
  await fs.move(req.file.path, finalPath);

  const publicUrl = `/images/photos/${gallery.id}/${newFileName}`;
  gallery.images.push(publicUrl);
  await saveGalleries(galleries);
  res.json(gallery);
});


// Supprimer la gallerie entière
app.delete("/api/galleries/:id", async (req, res) => {
  const galleries = await loadGalleries();
  const galleryId = req.params.id;

  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index === -1) return res.status(404).json({ message: "Galerie non trouvée" });

  const removed = galleries.splice(index, 1)[0];
  await saveGalleries(galleries);

  // ✅ Définir le chemin du dossier à supprimer
  const galleryDir = path.join(__dirname, "..", "public", "images", "photos", galleryId);

  fs.rm(galleryDir, { recursive: true, force: true }, (err) => {
    if (err) console.error("Erreur suppression dossier galerie :", err);
  });

  res.status(200).json({ message: "Galerie supprimée", galerie: removed });
});



// POST - supprimer une image d'une galerie
app.post("/api/galleries/:id/delete-image", async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL manquante" });

  const galleries = await loadGalleries();
  const gallery = galleries.find((g) => g.id === id);
  if (!gallery) return res.status(404).json({ error: "Galerie non trouvée" });

  const oldLength = gallery.images.length;
  gallery.images = gallery.images.filter((img) => (img.url || img) !== url);

  if (gallery.images.length === oldLength) {
    return res.status(404).json({ error: "Image non trouvée dans la galerie" });
  }

  // Optionnel : supprimer physiquement l'image si c'est un fichier local
  const localPrefix = `/images/photos/${gallery.id}/`;
  if (url.startsWith(localPrefix)) {
    const localPath = path.join(__dirname, "..", "public", url);
    fs.unlink(localPath, (err) => {
      if (err) console.warn("Erreur suppression fichier :", err.message);
    });
  }

  await saveGalleries(galleries);
  res.status(200).json({ message: "Image supprimée" });
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


app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));


app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});




////////// ÉQUIPE
const equipeFilePath = path.join(dataDir, "equipe.json");

// Init fichier si vide
if (!fs.existsSync(equipeFilePath)) {
  fs.writeFileSync(equipeFilePath, JSON.stringify([], null, 2));
}

// Helper pour lire/écrire l'équipe
function loadEquipe() {
  const raw = fs.readFileSync(equipeFilePath, "utf-8");
  return JSON.parse(raw);
}

function saveEquipe(data) {
  fs.writeFileSync(equipeFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// GET équipe
app.get("/api/equipe", (req, res) => {
  try {
    const equipe = loadEquipe();
    res.json(equipe);
  } catch (err) {
    console.error("Erreur lecture équipe :", err);
    res.status(500).json({ message: "Erreur lecture équipe" });
  }
});

// POST ajout membre
app.post("/api/equipe", (req, res) => {
  const { nom, poste, photo, type } = req.body;
  if (!nom || !poste || !type) return res.status(400).json({ message: "Nom, poste et type requis" });

  try {
    const equipe = loadEquipe();
    const nouveauMembre = { id: Date.now(), nom, poste, photo, type  };
    equipe.push(nouveauMembre);
    saveEquipe(equipe);
    res.status(201).json(nouveauMembre);
  } catch (err) {
    console.error("Erreur ajout membre :", err);
    res.status(500).json({ message: "Erreur ajout membre" });
  }
});


// Endpoint pour uploader une photo de membre d'équipe
app.post("/api/upload-photo", uploadEquipe.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier envoyé" });
  }

  const publicUrl = `/images/equipe/${req.file.filename}`;
  res.json({ url: publicUrl });
});



// DELETE membre
app.delete("/api/equipe/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const equipe = loadEquipe();
    const updatedEquipe = equipe.filter(m => m.id !== id);

    if (equipe.length === updatedEquipe.length) {
      return res.status(404).json({ message: "Membre non trouvé" });
    }

    saveEquipe(updatedEquipe);
    res.status(200).json({ message: "Membre supprimé" });
  } catch (err) {
    console.error("Erreur suppression membre :", err);
    res.status(500).json({ message: "Erreur suppression membre" });
  }
});



app.post("/api/equipe/reorder", (req, res) => {
  const newOrder = req.body;

  if (!Array.isArray(newOrder)) {
    return res.status(400).json({ message: "Format invalide (tableau attendu)" });
  }

  try {
    saveEquipe(newOrder);
    res.status(200).json({ message: "Ordre de l’équipe mis à jour" });
  } catch (err) {
    console.error("Erreur enregistrement ordre équipe :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


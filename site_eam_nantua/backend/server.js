const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 5000;




// Constantes d’authentification
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "secret123";



// Dossiers importants (.., public, images = uploads)
// const dataDir = path.join(__dirname, "data");
const dataDir = process.env.DATA_PATH || "/data";
const uploadDirEquipe = path.join(dataDir, "images", "equipe");
const partenairesUploadDir = path.join(dataDir, "images", "partenaires");
const accueilImageDir = path.join(dataDir, "images", "accueil");




// Création dossiers si inexistants
[
  path.join(dataDir, "images", "equipe"),
  path.join(dataDir, "images", "partenaires"),
  path.join(dataDir, "images", "accueil"),
  path.join(dataDir, "images", "photos"),
  path.join(dataDir, "images", "logos"),
  dataDir,
].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });



// Fichiers JSON et initialisation si inexistant
const accueilJsonPath = path.join(dataDir, "accueil.json");
if (!fs.existsSync(accueilJsonPath)) fs.writeFileSync(accueilJsonPath, JSON.stringify([], null, 2));

const factsJsonPath = path.join(dataDir, "facts.json");
if (!fs.existsSync(factsJsonPath)) fs.writeFileSync(factsJsonPath, JSON.stringify([], null, 2));

const formulairesFilePath = path.join(dataDir, "formulaires.json");
if (!fs.existsSync(formulairesFilePath)) fs.writeFileSync(formulairesFilePath, JSON.stringify([], null, 2));

const photosJsonPath = path.join(dataDir, "photos.json");
if (!fs.existsSync(photosJsonPath)) fs.writeFileSync(photosJsonPath, JSON.stringify([], null, 2));

const notesFilePath = path.join(dataDir, "notes.json");
if (!fs.existsSync(notesFilePath)) fs.writeFileSync(notesFilePath, JSON.stringify([], null, 2));

const partenairesFilePath = path.join(dataDir, "partenaires.json");
if (!fs.existsSync(partenairesFilePath)) fs.writeFileSync(partenairesFilePath, JSON.stringify([], null, 2));


const presentationFilePath = path.join(dataDir, "presentation.json");
if (!fs.existsSync(presentationFilePath)) {
  fs.writeFileSync(presentationFilePath, JSON.stringify({ title: "", subtitle: "", mission: "", address: "", courses: [] }, null, 2));
}




// Fichier PDF et initialisation si inexistant (pour presentation)
const documentsDir = path.join(dataDir, "documents");
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });





// Multer storage configs

// Stockage images équipe
const storageEquipe = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirEquipe),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const uploadEquipe = multer({ storage: storageEquipe });

// Stockage temporaire pour galeries
const uploadTemp = multer({ dest: "temp_uploads/" });

// Stockage images partenaires
const storagePartenaires = multer.diskStorage({
  destination: (req, file, cb) => cb(null, partenairesUploadDir),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});

const uploadPartenaireLogo = multer({ storage: storagePartenaires });

// Stockage image accueil
const storageAccueil = multer.diskStorage({
  destination: (req, file, cb) => cb(null, accueilImageDir),
  filename: (req, file, cb) => {
    // On récupère l'extension originale
    const ext = path.extname(file.originalname);
    // On crée un nom sûr avec timestamp + extension
    cb(null, Date.now() + ext);
  },
});

const uploadAccueil = multer({ 
  storage: storageAccueil,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(jpeg|png|jpg)/)) {
      return cb(new Error("Seules les images JPG/PNG sont acceptées"));
    }
    cb(null, true);
  }
});


// Stockage PDF
const storagePdf = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentsDir),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});

const uploadPdf = multer({ 
  storage: storagePdf,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB par exemple
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Seuls les fichiers PDF sont acceptés"));
    }
    cb(null, true);
  },
});






// Fonctions helpers JSON
function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Notes spécifiques
function loadNotes() {
  const raw = fs.readFileSync(notesFilePath, "utf-8");
  return JSON.parse(raw);
}
function saveNotes(data) {
  fs.writeFileSync(notesFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// Partenaires spécifiques
function loadPartenaires() {
  const raw = fs.readFileSync(partenairesFilePath, "utf-8");
  return JSON.parse(raw);
}
function savePartenaires(data) {
  fs.writeFileSync(partenairesFilePath, JSON.stringify(data, null, 2), "utf-8");
}




// Middleware
app.use(cors());
app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(dataDir, "images")));




// Routes
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







/////////// CONTACT
const contactFilePath = path.join(dataDir, "contact.json");

// Au démarrage, si le fichier n'existe pas, on initialise avec les 4 champs
if (!fs.existsSync(contactFilePath)) {
  fs.writeFileSync(
    contactFilePath,
    JSON.stringify({ email: "", phone: "", facebook: "", instagram: "" }, null, 2)
  );
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
  const { email, phone, facebook, instagram } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ message: "Email et téléphone requis" });
  }

  try {
    const updated = { email, phone, facebook: facebook || "", instagram: instagram || "" };
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
  try {
    const notes = loadNotes();
    res.json(notes);
  } catch (err) {
    console.error("Erreur lecture notes :", err);
    res.status(500).json({ message: "Erreur lecture notes" });
  }
});


// POST /api/notes
app.post("/api/notes", (req, res) => {
  try {
    const notes = loadNotes();
    const { title, content, date } = req.body;
    const newNote = { id: Date.now(), title, content, date: date || new Date().toISOString().split("T")[0] };
    notes.push(newNote);
    saveNotes(notes);
    res.status(201).json(newNote);
  } catch (err) {
    console.error("Erreur ajout note :", err);
    res.status(500).json({ message: "Erreur ajout note" });
  }
});


// DELETE /api/notes/:id
app.delete("/api/notes/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let notes = loadNotes();
    const initialLength = notes.length;
    notes = notes.filter(note => note.id !== id);
    if (notes.length === initialLength) {
      return res.status(404).json({ message: "Note non trouvée" });
    }
    saveNotes(notes);
    res.status(200).json({ message: "Note supprimée" });
  } catch (err) {
    console.error("Erreur suppression note :", err);
    res.status(500).json({ message: "Erreur suppression note" });
  }
});


// POST /api/notes/reorder
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
  const galleryDir = path.join(dataDir, "images", "photos", gallery.id);
  const finalPath = path.join(galleryDir, newFileName);

  await fs.ensureDir(galleryDir);
  await fs.move(req.file.path, finalPath);

  const publicUrl = `/uploads/photos/${gallery.id}/${newFileName}`;
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

  // Supprimer physiquement l'image si c'est un fichier local
  const localPrefix = `/uploads/photos/${gallery.id}/`;
  if (url.startsWith(localPrefix)) {
    const localPath = path.join(dataDir, "images", "photos", gallery.id, path.basename(url));
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


// app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));
app.use('/uploads', express.static(path.join(dataDir, 'images')));

app.use('/documents', express.static(documentsDir));

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

  // const publicUrl = `/images/equipe/${req.file.filename}`;
  const publicUrl = `/uploads/equipe/${req.file.filename}`;
  res.json({ url: publicUrl });
});



// DELETE membre
app.delete("/api/equipe/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const equipe = loadEquipe();
    const membreToDelete = equipe.find(m => m.id === id);

    if (!membreToDelete) {
      return res.status(404).json({ message: "Membre non trouvé" });
    }

    // Supprimer l’image physique si c’est une image stockée localement
    if (membreToDelete.photo && membreToDelete.photo.startsWith("/uploads/equipe/")) {
      const photoPath = path.join(dataDir, "uploads", "equipe", path.basename(membreToDelete.photo));
      fs.unlink(photoPath, (err) => {
        if (err) {
          console.warn("Erreur suppression photo membre :", err.message);
          // Non bloquant
        }
      });
    }

    const updatedEquipe = equipe.filter(m => m.id !== id);
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



/////////////// PARTENAIRES

// GET - récupérer tous les partenaires
app.get("/api/partenaires", (req, res) => {
  try {
    const partenaires = loadPartenaires();
    res.json(partenaires);
  } catch (err) {
    console.error("Erreur lecture partenaires :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST - ajouter un partenaire
app.post("/api/partenaires", (req, res) => {
  const { nom, logo, url } = req.body;
  if (!nom || !logo) return res.status(400).json({ message: "Nom et logo requis" });

  try {
    const partenaires = loadPartenaires();
    const nouveau = { id: Date.now(), nom, logo, url };
    partenaires.push(nouveau);
    savePartenaires(partenaires);
    res.status(201).json(nouveau);
  } catch (err) {
    console.error("Erreur ajout partenaire :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/api/upload-logo", uploadPartenaireLogo.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier envoyé" });
  }

  const publicUrl = `/uploads/partenaires/${req.file.filename}`;
  res.json({ url: publicUrl });
});


// DELETE - supprimer un partenaire
app.delete("/api/partenaires/:id", (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const partenaires = loadPartenaires();
    const partenaireToDelete = partenaires.find(p => p.id === id);

    if (!partenaireToDelete) {
      return res.status(404).json({ message: "Partenaire non trouvé" });
    }

    // Supprimer le fichier logo physiquement
    if (partenaireToDelete.logo) {
      const logoPath = path.join(__dirname, "..", "public", partenaireToDelete.logo.replace(/^\//, ""));
      fs.unlink(logoPath, (err) => {
        if (err) {
          console.warn("Erreur suppression fichier logo :", err.message);
          // Pas bloquant, on continue la suppression
        }
      });
    }

    // Supprimer du tableau
    const updated = partenaires.filter(p => p.id !== id);
    savePartenaires(updated);

    res.status(200).json({ message: "Partenaire supprimé" });
  } catch (err) {
    console.error("Erreur suppression partenaire :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// PUT - modifier tous les partenaires (batch)
app.put("/api/partenaires", (req, res) => {
  const newList = req.body;
  if (!Array.isArray(newList)) return res.status(400).json({ message: "Format attendu: tableau" });

  try {
    savePartenaires(newList);
    res.status(200).json({ message: "Liste mise à jour" });
  } catch (err) {
    console.error("Erreur mise à jour partenaires :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});





//////////// FACTS ACCUEIL

if (!fs.existsSync(factsJsonPath)) {
  fs.writeFileSync(factsJsonPath, JSON.stringify([], null, 2));
}

function loadFacts() {
  const raw = fs.readFileSync(factsJsonPath, 'utf-8');
  return JSON.parse(raw);
}

function saveFacts(data) {
  fs.writeFileSync(factsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
}



// GET - récupérer tous les facts
app.get('/api/facts', (req, res) => {
  try {
    const facts = loadFacts();
    res.json(facts);
  } catch (err) {
    console.error('Erreur lecture facts :', err);
    res.status(500).json({ message: 'Erreur lecture facts' });
  }
});

// POST - ajouter un nouveau fact
app.post('/api/facts', (req, res) => {
  const { title, value, icon } = req.body;
  if (!title || !value) {
    return res.status(400).json({ message: 'Titre et valeur requis' });
  }

  try {
    const facts = loadFacts();
    const newFact = { id: Date.now(), title, value, icon: icon || null };
    facts.push(newFact);
    saveFacts(facts);
    res.status(201).json(newFact);
  } catch (err) {
    console.error('Erreur ajout fact :', err);
    res.status(500).json({ message: 'Erreur ajout fact' });
  }
});

// PUT - modifier un fact existant
app.put('/api/facts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, value, icon } = req.body;

  if (!title || !value) {
    return res.status(400).json({ message: 'Titre et valeur requis' });
  }

  try {
    const facts = loadFacts();
    const index = facts.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ message: 'Fact non trouvé' });

    facts[index] = { ...facts[index], title, value, icon };
    saveFacts(facts);
    res.status(200).json(facts[index]);
  } catch (err) {
    console.error('Erreur modification fact :', err);
    res.status(500).json({ message: 'Erreur modification fact' });
  }
});

// DELETE - supprimer un fact
app.delete('/api/facts/:id', (req, res) => {
  const id = parseInt(req.params.id);

  try {
    let facts = loadFacts();
    const initialLength = facts.length;
    facts = facts.filter(f => f.id !== id);

    if (facts.length === initialLength) {
      return res.status(404).json({ message: 'Fact non trouvé' });
    }

    saveFacts(facts);
    res.status(200).json({ message: 'Fact supprimé' });
  } catch (err) {
    console.error('Erreur suppression fact :', err);
    res.status(500).json({ message: 'Erreur suppression fact' });
  }
});



// POST - upload image d'accueil
app.post("/api/upload-home-image", uploadAccueil.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier envoyé" });
  }

  // Lire l'ancien JSON pour récupérer l'ancienne image
  const oldData = readJson(accueilJsonPath);
    if (oldData && oldData.imageUrl) {
    // oldData.imageUrl = "/images/accueil/xxxxx.jpg"
    const oldImagePath = path.join(accueilImageDir, path.basename(oldData.imageUrl));
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        console.error("Erreur suppression ancienne image :", err);
      }
    }
  }

  // L'url relative de la nouvelle image (à adapter selon ta config serveur)
  // const imageUrl = `/images/accueil/${req.file.filename}`;
  const imageUrl = `/uploads/accueil/${req.file.filename}`;


  // Écrire la nouvelle info dans JSON (avec timestamp pour version)
  const accueilData = { imageUrl, version: Date.now() };
  writeJson(accueilJsonPath, accueilData);

  // Répondre avec les données mises à jour
  res.json(accueilData);
});



app.get("/api/image-version", (req, res) => {
  try {
    const accueilData = readJson(accueilJsonPath);
    if (!accueilData || !accueilData.version) {
      return res.status(404).json({ message: "Version non trouvée" });
    }
    res.json({ version: accueilData.version });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// app.get("/api/accueil-image", (req, res) => {
//   try {
//     const accueilData = readJson(accueilJsonPath);
//     if (!accueilData || !accueilData.imageUrl) {
//       return res.status(404).json({ message: "Image non trouvée" });
//     }
//     res.json({ imageUrl: accueilData.imageUrl, version: accueilData.version });
//   } catch (error) {
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// });

app.get("/api/accueil-image", (req, res) => {
  try {
    const accueilData = readJson(accueilJsonPath);
    console.log("BASE_URL =", process.env.BASE_URL); // <--- pour debug
    console.log("accueilData.imageUrl =", accueilData.imageUrl);

    if (!accueilData || !accueilData.imageUrl) {
      return res.status(404).json({ message: "Image non trouvée" });
    }

    const fullImageUrl = accueilData.imageUrl.startsWith("http")
      ? accueilData.imageUrl
      : `${process.env.BASE_URL}${accueilData.imageUrl}`;

    res.json({ imageUrl: fullImageUrl, version: accueilData.version });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});





app.get("/api/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "data", "contact.json"));
});






/////////////////// PRESENTATION// 
// GET - récupérer le contenu de présentation
app.get("/api/presentation-content", (req, res) => {
  fs.readFile(presentationFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erreur lecture." });
    res.json(JSON.parse(data));
  });
});

// POST - enregistrer les modifications
app.post("/api/presentation-content", (req, res) => {
  fs.writeFile(presentationFilePath, JSON.stringify(req.body, null, 2), "utf8", (err) => {
    if (err) return res.status(500).json({ error: "Erreur écriture." });
    res.json({ success: true });
  });
});

// Route upload PDF
app.post("/api/upload-pdf", uploadPdf.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Fichier PDF manquant" });
  }

  const oldPdfUrl = req.body.oldPdfUrl;

  if (oldPdfUrl && oldPdfUrl.startsWith("/uploads/pdf/")) {
    const oldPdfFilename = oldPdfUrl.replace("/uploads/pdf/", "");
    const oldPdfPath = path.join(__dirname, "uploads", "pdf", oldPdfFilename);

    fs.unlink(oldPdfPath, (err) => {
      if (err) {
        console.warn("Erreur suppression ancien PDF :", err.message);
      } else {
        console.log("Ancien PDF supprimé :", oldPdfPath);
      }
    });
  }

  const pdfUrl = `/documents/${req.file.filename}`;
  res.json({ pdfUrl });
});



app.post("/api/delete-pdf", (req, res) => {
  const { pdfUrl } = req.body;

  if (!pdfUrl || !pdfUrl.startsWith("/documents/")) {
    return res.status(400).json({ error: "PDF invalide ou manquant" });
  }

  // Chemin complet vers le fichier PDF à supprimer dans backend/uploads/pdf
  const pdfPath = path.join(documentsDir, pdfUrl.replace("/documents/", ""));

  // Chemin vers le fichier JSON dans backend/data/presentation.json
  const jsonPath = path.join(__dirname, "data", "presentation.json");

  fs.unlink(pdfPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.warn("Erreur suppression PDF :", err.message);
      return res.status(500).json({ error: "Erreur suppression PDF" });
    }

    console.log("PDF supprimé :", pdfPath);

    try {
      const content = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      content.pdfUrl = null;
      fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2), "utf-8");
      console.log("pdfUrl mis à null dans le JSON");
    } catch (jsonErr) {
      console.error("Erreur mise à jour JSON :", jsonErr.message);
      return res.status(500).json({ error: "Erreur mise à jour JSON" });
    }

    res.json({ success: true });
  });
});


/////////////// FORMS INSCROPTION
// ─── Fichiers JSON nécessaires ─────────────────────────────────────────────────
const tarifsFilePath = path.join(dataDir, "tarifs.json");
const inscriptionsFilePath = path.join(dataDir, "inscriptions.json");
const anneesFilePath = path.join(dataDir, "annees.json");

// Init fichiers si inexistants
if (!fs.existsSync(tarifsFilePath)) {
  fs.writeFileSync(tarifsFilePath, JSON.stringify({
    coursParticuliers: [], 
    pratiquesCollectives: [], 
    instruments: [],
    cotisationAnnuelle: 25,
    reductions: { foyer10pct: 0.10, deuxiemeDiscipline33pct: 0.33, exclureYogaChorale: true }
  }, null, 2));
}
if (!fs.existsSync(inscriptionsFilePath)) {
  fs.writeFileSync(inscriptionsFilePath, JSON.stringify([], null, 2));
}
if (!fs.existsSync(anneesFilePath)) {
  const a = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  fs.writeFileSync(anneesFilePath, JSON.stringify({ courante: a, liste: [a] }, null, 2));
}

function loadTarifs() {
  return JSON.parse(fs.readFileSync(tarifsFilePath, "utf-8"));
}
function saveTarifs(data) {
  fs.writeFileSync(tarifsFilePath, JSON.stringify(data, null, 2), "utf-8");
}
function loadInscriptions() {
  return JSON.parse(fs.readFileSync(inscriptionsFilePath, "utf-8"));
}
function saveInscriptions(data) {
  fs.writeFileSync(inscriptionsFilePath, JSON.stringify(data, null, 2), "utf-8");
}
function loadAnnees() { 
  return JSON.parse(fs.readFileSync(anneesFilePath, "utf-8")); 
}
function saveAnnees(d) { 
  fs.writeFileSync(anneesFilePath, JSON.stringify(d, null, 2), "utf-8"); 
}
 

// ─── GET tarifs ───────────────────────────────────────────────────────────────
app.get("/api/tarifs", (req, res) => {
  try { res.json(loadTarifs()); }
  catch (err) { console.error(err); res.status(500).json({ message: "Erreur lecture tarifs" }); }
});

// ─── PUT tarifs (admin) ───────────────────────────────────────────────────────
app.put("/api/tarifs", (req, res) => {
  try { saveTarifs(req.body); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ message: "Erreur sauvegarde tarifs" }); }
});

// ─── INSCRIPTIONS ─────────────────────────────────────────────────────────────

// GET toutes les inscriptions (admin)
app.get("/api/inscriptions", (req, res) => {
  try { res.json(loadInscriptions()); }
  catch (err) { console.error(err); res.status(500).json({ message: "Erreur" }); }
});

// GET par code (utilisateur qui retrouve son dossier)
app.get("/api/inscriptions/code/:code", (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const inscriptions = loadInscriptions();
    const found = inscriptions.find((i) => i.code === code);
    if (!found) return res.status(404).json({ message: "Aucune inscription trouvée" });
    res.json(found);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ─── POST inscription (formulaire utilisateur) ────────────────────────────────
app.post("/api/inscriptions", (req, res) => {
  try {
    const inscriptions = loadInscriptions();
    const annees = loadAnnees();

    // Vérifier que le code généré côté client n'existe pas déjà (très improbable mais sécurité)
    const code = req.body.code || genCode();
    if (inscriptions.find((i) => i.code === code)) {
      // Régénérer si collision
      req.body.code = genCode();
    }

    const newIns = {
      id: Date.now(),
      annee: annees.courante || null,
      statut: "en_attente",
      ...req.body,
      code: req.body.code || code,
      dateInscription: req.body.dateInscription || new Date().toISOString(),
    };
    inscriptions.push(newIns);
    saveInscriptions(inscriptions);
    res.status(201).json({ success: true, id: newIns.id, code: newIns.code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur inscription" });
  }
});

// PUT mise à jour d'une inscription existante (modification par l'utilisateur via son code)
app.put("/api/inscriptions/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const inscriptions = loadInscriptions();
    const idx = inscriptions.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ message: "Inscription non trouvée" });

    const existing = inscriptions[idx];

    // Si l'inscription est déjà validée, bloquer la modification côté serveur
    if (existing.statut === "valide") {
      return res.status(403).json({ message: "Cette inscription a été validée par le bureau et ne peut plus être modifiée en ligne." });
    }

    // Mettre à jour en conservant id, code, annee, statut, dateInscription originale
    inscriptions[idx] = {
      ...existing,
      ...req.body,
      id: existing.id,
      code: existing.code,
      annee: existing.annee,
      statut: existing.statut,
      dateInscription: existing.dateInscription,
      dateModification: new Date().toISOString(),
    };
    saveInscriptions(inscriptions);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur mise à jour" });
  }
});

// PUT valider une inscription (admin uniquement)
app.put("/api/inscriptions/:id/valider", (req, res) => {
  try {
    const id = Number(req.params.id);
    const inscriptions = loadInscriptions();
    const idx = inscriptions.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ message: "Inscription non trouvée" });

    inscriptions[idx] = {
      ...inscriptions[idx],
      statut: "valide",
      dateValidation: new Date().toISOString(),
    };
    saveInscriptions(inscriptions);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur validation" });
  }
});

// DELETE inscription (admin)
app.delete("/api/inscriptions/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    saveInscriptions(loadInscriptions().filter((i) => i.id !== id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur suppression" });
  }
});

// POST archiver les inscriptions d'une année (les marquer archived: true)
app.post("/api/inscriptions/archiver", (req, res) => {
  try {
    const { annee } = req.body;
    if (!annee) return res.status(400).json({ message: "Année requise" });

    const inscriptions = loadInscriptions();
    const aArchiver = inscriptions.filter((i) => i.annee === annee);

    // Sauvegarder une copie dédiée à cette année
    const archivePath = path.join(dataDir, `inscriptions_${annee}.json`);
    fs.writeFileSync(archivePath, JSON.stringify(aArchiver, null, 2), "utf-8");

    // Marquer archived: true dans le fichier principal
    const updated = inscriptions.map((i) =>
      i.annee === annee ? { ...i, archived: true } : i
    );
    saveInscriptions(updated);

    res.json({ success: true, nb: aArchiver.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur archivage" });
  }
});
 


// ANNÉES SCOLAIRES
app.get("/api/annees", (req, res) => {
  try { res.json(loadAnnees().liste || []); }
  catch { res.json([]); }
});

app.get("/api/annee-courante", (req, res) => {
  try { res.json({ annee: loadAnnees().courante || null }); }
  catch { res.json({ annee: null }); }
});

app.put("/api/annee-courante", (req, res) => {
  try {
    const { annee } = req.body;
    if (!annee) return res.status(400).json({ message: "Année requise" });
    const data = loadAnnees();
    data.courante = annee;
    if (!data.liste.includes(annee)) data.liste.push(annee);
    saveAnnees(data);
    res.json({ success: true, annee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur" });
  }
});

app.post("/api/annees", (req, res) => {
  try {
    const { annee } = req.body;
    if (!annee) return res.status(400).json({ message: "Année requise" });
    const data = loadAnnees();
    if (!data.liste.includes(annee)) data.liste.push(annee);
    saveAnnees(data);
    res.json({ success: true, annees: data.liste });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur" });
  }
});

// ─── Helper : génération de code unique ───────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
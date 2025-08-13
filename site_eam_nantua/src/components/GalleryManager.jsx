import { useEffect, useState } from "react";
import "./GalleryManager.css";

export default function GalleryManager() {
  console.log("GalleryManager render");

  const [galleries, setGalleries] = useState([]);
  const [newGallery, setNewGallery] = useState({ id: "", title: "" });
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
      console.log("ENV:", import.meta.env);
      fetchGalleries();
    }, []);

  // function getFullPhotoUrl(photo) {
  //   if (!photo) return `${API}/uploads/placeholder.jpg`;
  //   if (photo.startsWith("http")) return photo;
    
  //   // Corriger le chemin si besoin
  //   if (photo.startsWith("/images/photos")) {
  //     return `${API}/uploads/photos${photo.slice("/images/photos".length)}`;
  //   }
    
  //   return `${API}${photo}`;
  // }

  // function getFullPhotoUrl(photo) {
  //   if (!photo) return `${API}/uploads/placeholder.jpg`;
  //   if (photo.startsWith("http")) return photo;
  //   return `${API}${photo}`;
  // }
  function getFullPhotoUrl(photo) {
    if (!photo) return `${API}/uploads/placeholder.jpg`;
    if (photo.startsWith("http")) return photo; // URL complète

    // Si c’est un chemin relatif qui commence par /uploads/photos/, on ajoute juste API avant
    if (photo.startsWith("/uploads/photos/")) {
      return `${API}${photo}`;
    }

    // Sinon, juste concaténer API + photo
    return `${API}/${photo}`;
  }






  const fetchGalleries = async () => {
    try {
      // const res = await fetch("/api/galleries");
      const res = await fetch(`${API}/api/galleries`);
      const data = await res.json();
      setGalleries(data);
    } catch (err) {
      console.error("Erreur lors du fetch des galeries", err);
    }
  };

  const createGallery = async () => {
    if (!newGallery.id || !newGallery.title) return;
    try {
      // const res = await fetch("/api/galleries", {
      const res = await fetch(`${API}/api/galleries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGallery),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewGallery({ id: "", title: "" });
      fetchGalleries();
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const uploadImage = async () => {
    if (!imageFile?.length || !selectedGallery) return;

    setUploading(true);
    try {
      for (const file of imageFile) {
        const formData = new FormData();
        formData.append("photo", file);

        // const res = await fetch(`/api/galleries/${selectedGallery.id}/upload`, {
        const res = await fetch(`${API}/api/galleries/${selectedGallery.id}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
      }

      // const newRes = await fetch("/api/galleries");
      const newRes = await fetch(`${API}/api/galleries`);
      const updatedGalleries = await newRes.json();
      setGalleries(updatedGalleries);

      const updatedGallery = updatedGalleries.find(g => g.id === selectedGallery.id);
      if (updatedGallery) setSelectedGallery(updatedGallery);

      setImageFile(null);
    } catch (err) {
      alert("Erreur upload : " + err.message);
    } finally {
      setUploading(false);
    }
  };



  const addImageFromUrl = async () => {
    if (!imageUrl || !selectedGallery) return;
    try {
      // const res = await fetch(`/api/galleries/${selectedGallery.id}/add-url`, {
      const res = await fetch(`${API}/api/galleries/${selectedGallery.id}/add-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchGalleries();
      setImageUrl("");
    } catch (err) {
      alert("Erreur ajout URL : " + err.message);
    }
  };


// Dans le composant GalleryManager.jsx
const deleteGallery = (id) => {
  if (!id) {
    console.error("ID de galerie invalide :", id);
    return;
  }

  const confirmDelete = window.confirm("⚠️ Supprimer cette galerie ? Cette action est irréversible.");
  if (!confirmDelete) return;

  // fetch(`/api/galleries/${id}`, {
  fetch(`${API}/api/galleries/${id}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (res.ok) {
        setGalleries((prev) => prev.filter((g) => g.id !== id));

        if (selectedGallery?.id === id) {
          setSelectedGallery(null);
        }
      } else {
        console.error("Échec suppression : ", res.statusText);
      }
    })
    .catch((err) => console.error("Erreur suppression :", err));
};




const deleteImage = async (imgUrl) => {
  if (!window.confirm("Supprimer cette image ?")) return;

  try {
    const res = await fetch(
      // `/api/galleries/${selectedGallery.id}/delete-image`,
      `${API}/api/galleries/${selectedGallery.id}/delete-image`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imgUrl }),
      }
    );

    if (!res.ok) throw new Error(await res.text());

    // ✅ MAJ locale de selectedGallery après suppression
    const updatedImages = selectedGallery.images.filter((img) => {
      const url = img.url || img;
      return url !== imgUrl;
    });

    setSelectedGallery({ ...selectedGallery, images: updatedImages });

    // Optionnel : tu peux aussi mettre à jour toutes les galeries
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === selectedGallery.id ? { ...g, images: updatedImages } : g
      )
    );

  } catch (err) {
    alert("Erreur suppression image : " + err.message);
  }
};





  return (
    <div className="gallery-manager">

        <div className="gallery-creation">
            <input
            placeholder="ID (ex: ete2024)"
            value={newGallery.id}
            onChange={(e) => setNewGallery({ ...newGallery, id: e.target.value })}
            />
            <input
            placeholder="Titre"
            value={newGallery.title}
            onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
            />
            <button onClick={createGallery} className="add-button-violet">Créer</button>
        </div>

        <div className="gallery-grid">
            {galleries.map((gal) => (
                <div key={gal.id} className="gallery-card">
                <div onClick={() => setSelectedGallery(gal)}>
                    {/* <img src={gal.images?.[0]?.url || gal.images?.[0] || "/placeholder.jpg"} alt="" /> */}
                    {/* <img src={gal.images?.[0]?.url || gal.images?.[0] || `${import.meta.env.VITE_API_URL}/uploads/placeholder.jpg`} alt={gal.title} /> ici ??? */}
                    
                    {/* <img src={getFullPhotoUrl(gal.images?.[0]?.url || gal.images?.[0])} alt={gal.title} /> */}
                    <img src={getFullPhotoUrl(img.url || img, gal.id)} alt={gal.title} />

                    <div className="font-semibold">{gal.title}</div>
                    <div className="text-sm text-gray-600">{gal.id}</div>
                </div>
                <button onClick={() => deleteGallery(gal.id)}>Supprimer</button>

                </div>
            ))}
        </div>


        {selectedGallery && (
            <div className="gallery-details">
                <div className="gallery-header">
                    <h3>📂 Galerie : {selectedGallery.title}</h3>
                    <button className="delete-button" onClick={() => deleteGallery(selectedGallery.id)}>
                    Supprimer galerie
                    </button>
                </div>

                <div className="gallery-thumbnails">
                    {selectedGallery.images?.map((img, i) => {
                    const url = img.url || img;
                    return (
                        <div key={i} className="thumbnail-container">
                        {/* <img src={url} alt="" /> */}

                        {/* <img src={getFullPhotoUrl(url)} alt="" /> */}
                        <img src={getFullPhotoUrl(url, selectedGallery.id)} alt="" />

                        <button onClick={() => deleteImage(url)}>✕</button>
                        </div>
                    );
                })}
            </div>


            <div className="upload-section">
                {/* <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />  Version 1 image */}
                <input type="file" multiple onChange={(e) => setImageFile(Array.from(e.target.files))} />
                <button onClick={uploadImage} disabled={uploading}>
                {uploading ? "Chargement..." : "Uploader"}
                </button>
            </div>

            <div className="url-section">
                <input
                placeholder="URL d'image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                />
                <button onClick={addImageFromUrl}>Ajouter par URL</button>
            </div>

            <div className="back-button" onClick={() => setSelectedGallery(null)}>
                ⬅️ Retour
            </div>
            </div>
      )}
    </div>
  );
}

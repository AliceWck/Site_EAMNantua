import { useState } from "react";
import "./AdminLogin.css";
import { Link } from "react-router-dom";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // const res = await fetch("http://localhost:5000/api/login", {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json();
        setError(data.message || "Identifiants incorrects");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      setError("Impossible de se connecter au serveur.");
    }
  };


  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Connexion admin</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div style={{position:"relative"}}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width:"100%", paddingRight:"2.5rem"}}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer", padding:"0.25rem",
                color:"#666", fontSize:"1.1rem", minWidth:"auto"
              }}
              tabIndex={-1}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </>
                )}
              </svg>
            </button>
          </div>
          <button type="submit">Se connecter</button>
        </form>

        {error && <p className="error">{error}</p>}
        <p></p>
        <Link to="/">⬅️ Retour au site</Link>
      </div>
    </div>
  );
}
import { useState } from "react";
import "./AdminLogin.css";
import { Link } from "react-router-dom";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const res = await fetch("http://localhost:5000/api/login", {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      onLogin();
    } else {
      setError("Identifiants incorrects");
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
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Se connecter</button>
        </form>
        {error && <p className="error">{error}</p>}

        <p></p>
        <Link to="/">⬅️ Retour au site</Link>

      </div>
    </div>
  );
}

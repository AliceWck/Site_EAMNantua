import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <AdminPanel onLogout={() => setLoggedIn(false)} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} />
  );
}


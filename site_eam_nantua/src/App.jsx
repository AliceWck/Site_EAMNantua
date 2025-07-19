// Penser à histoire de proxy

// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HashRouter as Router, Routes, Route } from "react-router-dom"; 
import Accueil from "./components/Accueil";
import Archives from "./components/Archives";
import Inscription from "./components/Inscription";
import Admin from "./components/Admin";
import Contact from "./components/Contact";
import Presentation from "./components/Presentation";
import EvenementPage from "./components/EvenementPage";
import Equipe from "./components/Equipe";
import Mentions from "./components/Mentions";
import Partenaires from "./components/Partenaires";


export default function App() {
  return (
    <div className="layout">
      <Router>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/evenements/:slug" element={<EvenementPage />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/mentions" element={<Mentions />} />
          <Route path="/partenaires" element={<Partenaires />} />
        </Routes>
      </Router>
    </div>
  );
}

import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        © {new Date().getFullYear()} EAM Nantua — <Link to="/admin">Admin</Link>
      </div>
      <div className="footer-right">
        <Link to="/mentions">Mentions légales</Link>
      </div>
    </footer>
  );
}

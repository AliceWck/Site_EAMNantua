import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} EAM Nantua — <Link to="/admin">Admin</Link>
    </footer>
  );
}

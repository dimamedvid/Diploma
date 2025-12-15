import { Link } from "react-router-dom";
import "./Footer.css";
import icon from "../../assets/icon.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__left">
          <Link to="/" className="footer__logo" aria-label="Перейти на головну">
            <img className="footer__icon" src={icon} alt="Ukr-Book logo" />
            <h2 className="footer__title">Ukr-Book</h2>
          </Link>
          <p className="footer__text">© {new Date().getFullYear()} Ukr-Book. Усі права захищено.</p>
        </div>

        <div className="footer__links">
          <ul className="footer__items">
            <li className="footer__item"></li>
            <li className="footer__item"></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

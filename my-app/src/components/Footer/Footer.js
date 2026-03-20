import { Link } from "react-router-dom";
import "./Footer.css";
import icon from "../../assets/icon.png";

/**
 * Нижня частина інтерфейсу застосунку.
 *
 * Компонент відображає:
 * - логотип і назву системи;
 * - посилання на головну сторінку;
 * - текст із поточним роком і повідомленням про авторські права;
 * - область для додаткових посилань у підвалі.
 *
 * На поточному етапі блок `footer__links` містить заготовку
 * для майбутнього розширення навігації в нижній частині сторінки.
 *
 * @returns {JSX.Element} Підвал застосунку.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__left">
          <Link to="/" className="footer__logo" aria-label="Перейти на головну">
            <img className="footer__icon" src={icon} alt="Ukr-Book logo" />
            <h2 className="footer__title">Ukr-Book</h2>
          </Link>
          <p className="footer__text">
            © {new Date().getFullYear()} Ukr-Book. Усі права захищено.
          </p>
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
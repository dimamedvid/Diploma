import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";
import { getLocalizedErrorMessage } from "../../utils/errorLocalization";

/**
 * Сторінка для маршруту, якого не існує.
 *
 * @returns {JSX.Element} Сторінка 404.
 */
function NotFoundPage() {
  const text = getLocalizedErrorMessage("common.notFound");
  const helpText = getLocalizedErrorMessage("common.notFoundHelp");
  const homeLabel = getLocalizedErrorMessage("common.goHome");

  return (
    <div className="not-found-page">
      <div className="not-found-page__card">
        <h1 className="not-found-page__title">404</h1>
        <p className="not-found-page__text">{text}</p>
        <p className="not-found-page__help">{helpText}</p>

        <Link className="not-found-page__link" to="/">
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
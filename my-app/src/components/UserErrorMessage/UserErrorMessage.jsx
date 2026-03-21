import React from "react";
import "./UserErrorMessage.css";
import { getLocalizedErrorMessage } from "../../utils/errorLocalization";

/**
 * Компонент дружнього повідомлення про API-помилку для користувача.
 *
 * Показує:
 * - зрозуміле повідомлення без технічних деталей;
 * - інструкцію щодо подальших дій;
 * - errorId і requestId;
 * - можливість повідомити про проблему.
 *
 * @param {Object} props - Властивості компонента.
 * @param {Object|null} props.error - Об'єкт помилки від backend.
 * @returns {JSX.Element|null} Відображення повідомлення або null.
 */
function UserErrorMessage({ error }) {
  if (!error) {
    return null;
  }

  const localizedMessage = getLocalizedErrorMessage(error.messageKey, error.message);
  const title = getLocalizedErrorMessage("common.errorLabel");
  const helpText = getLocalizedErrorMessage("common.checkDataHelp");
  const reportLabel = getLocalizedErrorMessage("common.reportProblem");
  const errorCodeLabel = getLocalizedErrorMessage("common.errorCode");
  const requestCodeLabel = getLocalizedErrorMessage("common.requestCode");

  const subject = encodeURIComponent("Problem report");
  const body = encodeURIComponent(
    `Error ID: ${error.errorId || "n/a"}\nRequest ID: ${error.requestId || "n/a"}\nMessage: ${localizedMessage}`,
  );

  return (
    <div className="user-error-message">
      <h3 className="user-error-message__title">{title}</h3>

      <p className="user-error-message__text">{localizedMessage}</p>

      <p className="user-error-message__help">{helpText}</p>

      {error.errorId && (
        <p className="user-error-message__meta">
          {errorCodeLabel}: <strong>{error.errorId}</strong>
        </p>
      )}

      {error.requestId && (
        <p className="user-error-message__meta">
          {requestCodeLabel}: <strong>{error.requestId}</strong>
        </p>
      )}

      <a
        className="user-error-message__link"
        href={`mailto:support@example.com?subject=${subject}&body=${body}`}
      >
        {reportLabel}
      </a>
    </div>
  );
}

export default UserErrorMessage;
import React from "react";
import "./ErrorBoundary.css";
import { getLocalizedErrorMessage } from "../../utils/errorLocalization";

/**
 * Генерує унікальний ідентифікатор для runtime-помилки UI.
 *
 * @returns {string} Унікальний ідентифікатор помилки.
 */
function createUiErrorId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Error Boundary для перехоплення runtime-помилок React.
 *
 * Компонент:
 * - перехоплює помилки рендерингу дочірніх компонентів;
 * - показує дружню сторінку помилки;
 * - формує унікальний код помилки для користувача.
 */
class ErrorBoundary extends React.Component {
  /**
   * Створює екземпляр ErrorBoundary.
   *
   * @param {Object} props - Властивості компонента.
   */
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorId: null,
    };
  }

  /**
   * Оновлює стан компонента після виникнення помилки в дочірньому дереві.
   *
   * Викликається React автоматично перед повторним рендером fallback UI.
   *
   * @returns {Object} Новий стан компонента з ознакою помилки.
   */
  static getDerivedStateFromError() {
    return {
      hasError: true,
      errorId: createUiErrorId(),
    };
  }

  /**
   * Логує технічну інформацію про runtime-помилку інтерфейсу.
   *
   * @param {Error} error - Об'єкт помилки.
   * @param {Object} errorInfo - Додаткова інформація React про компонент.
   * @returns {void}
   */
  componentDidCatch(error, errorInfo) {
    // У майбутньому тут можна додати відправку технічних даних на backend.
    // eslint-disable-next-line no-console
    console.error("UI runtime error:", {
      errorId: this.state.errorId,
      error,
      errorInfo,
    });
  }

  /**
   * Оновлює поточну сторінку браузера.
   *
   * @returns {void}
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Рендерить або дочірні компоненти, або fallback UI у разі помилки.
   *
   * @returns {JSX.Element|React.ReactNode} Контент застосунку або сторінка помилки.
   */
  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = getLocalizedErrorMessage("common.errorTitle");
    const text = getLocalizedErrorMessage("common.runtime");
    const helpText = getLocalizedErrorMessage("common.runtimeHelp");
    const refreshLabel = getLocalizedErrorMessage("common.refreshPage");
    const reportLabel = getLocalizedErrorMessage("common.reportProblem");
    const errorCodeLabel = getLocalizedErrorMessage("common.errorCode");

    const subject = encodeURIComponent("UI runtime problem");
    const body = encodeURIComponent(`Error ID: ${this.state.errorId}`);

    return (
      <div className="error-boundary">
        <div className="error-boundary__card">
          <h1 className="error-boundary__title">{title}</h1>

          <p className="error-boundary__text">{text}</p>
          <p className="error-boundary__help">{helpText}</p>

          <p className="error-boundary__meta">
            {errorCodeLabel}: <strong>{this.state.errorId}</strong>
          </p>

          <div className="error-boundary__actions">
            <button
              type="button"
              className="error-boundary__button"
              onClick={this.handleReload}
            >
              {refreshLabel}
            </button>

            <a
              className="error-boundary__link"
              href={`mailto:support@example.com?subject=${subject}&body=${body}`}
            >
              {reportLabel}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
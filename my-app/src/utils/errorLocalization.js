import errorMessages from "../i18n/errorMessages";

/**
 * Повертає поточну мову інтерфейсу.
 *
 * Спочатку перевіряє localStorage, потім браузерну мову.
 *
 * @returns {"uk"|"en"} Поточна мова.
 */
export function getCurrentLanguage() {
  const savedLanguage = localStorage.getItem("appLang");

  if (savedLanguage === "uk" || savedLanguage === "en") {
    return savedLanguage;
  }

  const browserLanguage = navigator.language?.toLowerCase() || "en";
  return browserLanguage.startsWith("uk") ? "uk" : "en";
}

/**
 * Повертає локалізоване повідомлення за ключем.
 *
 * @param {string} messageKey - Ключ локалізованого повідомлення.
 * @param {string} [fallbackMessage] - Резервний текст, якщо ключа нема.
 * @returns {string} Локалізований або резервний текст.
 */
export function getLocalizedErrorMessage(messageKey, fallbackMessage = "") {
  const currentLanguage = getCurrentLanguage();
  const selectedDictionary = errorMessages[currentLanguage] || errorMessages.en;

  if (messageKey && selectedDictionary[messageKey]) {
    return selectedDictionary[messageKey];
  }

  return fallbackMessage || selectedDictionary["common.internal"] || "Something went wrong.";
}
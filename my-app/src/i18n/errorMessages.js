/**
 * Словник локалізованих повідомлень про помилки та UI-текстів.
 */
const errorMessages = {
  uk: {
    "common.internal": "Щось пішло не так на сервері. Спробуйте пізніше.",
    "common.runtime": "Сталася помилка під час роботи сторінки.",
    "common.notFound": "Сторінку не знайдено.",
    "common.errorTitle": "Щось пішло не так",
    "common.errorLabel": "Помилка",
    "common.reportProblem": "Повідомити про проблему",
    "common.goHome": "На головну",
    "common.tryAgain": "Спробувати ще раз",
    "common.refreshPage": "Оновити сторінку",
    "common.checkDataHelp":
      "Спробуйте перевірити введені дані, оновити сторінку або увійти повторно.",
    "common.runtimeHelp":
      "Оновіть сторінку. Якщо проблема повторюється, повідомте про неї та вкажіть код помилки.",
    "common.notFoundHelp": "Перевірте адресу сторінки або поверніться на головну.",
    "common.errorCode": "Код помилки",
    "common.requestCode": "Код запиту",

    "auth.requiredFields": "Будь ласка, заповніть усі обов’язкові поля.",
    "auth.invalidLogin": "Логін має містити 4–25 символів, лише латинські літери та цифри.",
    "auth.invalidEmail": "Email має бути у форматі name@mail.com.",
    "auth.invalidPasswordFormat":
      "Пароль має містити 8–20 символів, щонайменше одну літеру та одну цифру.",
    "auth.loginExists": "Такий логін уже зайнятий.",
    "auth.emailExists": "Такий email уже зареєстрований.",
    "auth.invalidCredentials": "Невірний логін, email або пароль.",
    "auth.noToken": "Для доступу до цієї сторінки потрібно увійти в систему.",
    "auth.invalidToken": "Сесія недійсна або завершилась. Увійдіть у систему повторно.",
  },

  en: {
    "common.internal": "Something went wrong on the server. Please try again later.",
    "common.runtime": "An error occurred while loading the page.",
    "common.notFound": "Page not found.",
    "common.errorTitle": "Something went wrong",
    "common.errorLabel": "Error",
    "common.reportProblem": "Report a problem",
    "common.goHome": "Go home",
    "common.tryAgain": "Try again",
    "common.refreshPage": "Refresh page",
    "common.checkDataHelp":
      "Please check your input, refresh the page, or sign in again.",
    "common.runtimeHelp":
      "Refresh the page. If the problem persists, report it and include the error code.",
    "common.notFoundHelp": "Check the page address or return to the home page.",
    "common.errorCode": "Error code",
    "common.requestCode": "Request code",

    "auth.requiredFields": "Please fill in all required fields.",
    "auth.invalidLogin": "Login must contain 4–25 characters and only Latin letters or digits.",
    "auth.invalidEmail": "Email must have the format name@mail.com.",
    "auth.invalidPasswordFormat":
      "Password must contain 8–20 characters, at least one letter and one digit.",
    "auth.loginExists": "This login is already taken.",
    "auth.emailExists": "This email is already registered.",
    "auth.invalidCredentials": "Invalid login, email or password.",
    "auth.noToken": "Please sign in to access this page.",
    "auth.invalidToken": "Your session is invalid or expired. Please sign in again.",
  },
};

export default errorMessages;
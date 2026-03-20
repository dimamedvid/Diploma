const { Given, When, Then } = require("@cucumber/cucumber");

/**
 * Базова адреса frontend-застосунку для browser / BDD тестів.
 *
 * Використовується у step definitions для навігації
 * між сторінками під час виконання Cucumber-сценаріїв.
 *
 * @constant {string}
 */
const BASE_URL = "http://localhost:3000";

/**
 * Крок BDD: відкриває застосунок за переданою адресою.
 *
 * Використовується для початкового переходу на потрібну сторінку
 * у сценаріях тестування інтерфейсу.
 *
 * @param {string} url - URL сторінки, яку потрібно відкрити.
 * @returns {Promise<void>}
 */
Given("the user opens the application at {string}", async function (url) {
  await this.page.goto(url);
});

/**
 * Крок BDD: відкриває домашню сторінку застосунку.
 *
 * За змістом дублює перехід на переданий URL,
 * але використовується в сценаріях як окремий
 * читабельний опис початкового стану тесту.
 *
 * @param {string} url - URL домашньої сторінки.
 * @returns {Promise<void>}
 */
Given("the user is on the home page {string}", async function (url) {
  await this.page.goto(url);
});

/**
 * Крок BDD: переходить на сторінку входу користувача.
 *
 * @returns {Promise<void>}
 */
When("the user navigates to the login page", async function () {
  await this.page.goto(`${BASE_URL}/login`);
});

/**
 * Крок BDD: вводить логін і пароль у форму авторизації.
 *
 * Поля визначаються через CSS-селектори `input[name="login"]`
 * та `input[name="password"]`.
 *
 * @param {string} login - Значення логіна.
 * @param {string} password - Значення пароля.
 * @returns {Promise<void>}
 */
When(
  "the user enters login {string} and password {string}",
  async function (login, password) {
    await this.page.fill("input[name=\"login\"]", login);
    await this.page.fill("input[name=\"password\"]", password);
  },
);

/**
 * Крок BDD: надсилає форму входу натисканням кнопки submit.
 *
 * @returns {Promise<void>}
 */
When("the user submits the login form", async function () {
  await this.page.click("button[type=\"submit\"]");
});

/**
 * Крок BDD: перевіряє, що після успішного входу
 * користувача перенаправлено на головну сторінку.
 *
 * @returns {Promise<void>}
 */
Then("the user should be redirected to the home page", async function () {
  await this.page.waitForURL(`${BASE_URL}/`);
});

/**
 * Крок BDD: перевіряє наявність заданого тексту на сторінці.
 *
 * Використовується як універсальна перевірка відображення
 * повідомлень, заголовків або результатів дій користувача.
 *
 * @param {string} text - Текст, який повинен бути присутній на сторінці.
 * @returns {Promise<void>}
 */
Then("the user should see the text {string}", async function (text) {
  await this.page.waitForSelector(`text=${text}`);
});

/**
 * Крок BDD: вводить пошуковий запит у поле пошуку творів.
 *
 * @param {string} query - Текст пошукового запиту.
 * @returns {Promise<void>}
 */
When("the user enters {string} into the search field", async function (query) {
  await this.page.fill(".filters__search", query);
});

/**
 * Крок BDD: перевіряє, що кількість знайдених творів оновилася
 * після зміни пошукового запиту.
 *
 * Алгоритм перевірки:
 * 1. Очікує появу елемента з лічильником результатів.
 * 2. Переконується, що текст має формат `Знайдено: <число>`.
 * 3. Додатково перевіряє спеціальний сценарій для запиту `кобзар`,
 *    де очікується рівно один знайдений твір.
 *
 * Цей крок документує бізнес-очікування для пошуку на головній сторінці.
 *
 * @returns {Promise<void>}
 * @throws {Error} Якщо лічильник результатів має неочікуваний формат
 * або якщо для контрольного запиту кількість результатів не збігається.
 */
Then("the number of found literary works should be updated", async function () {
  const countEl = await this.page.waitForSelector(".results__count");

  const text = (await countEl.textContent()) || "";
  if (!/Знайдено:\s*\d+/.test(text)) {
    throw new Error(`Unexpected results count text: "${text}"`);
  }

  const currentQuery = await this.page.inputValue(".filters__search");
  if (currentQuery.trim().toLowerCase() === "кобзар") {
    if (!/Знайдено:\s*1\b/.test(text)) {
      throw new Error(`Expected "Знайдено: 1" for query "Кобзар", but got: "${text}"`);
    }
  }
});
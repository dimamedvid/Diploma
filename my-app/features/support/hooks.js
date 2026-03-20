const { Before, After } = require("@cucumber/cucumber");
const { chromium } = require("playwright");

/**
 * Хук, що виконується перед кожним BDD-сценарієм.
 *
 * Ініціалізує новий екземпляр браузера Playwright у headless-режимі
 * та відкриває нову сторінку, яка буде використовуватись
 * у step definitions поточного сценарію.
 *
 * Значення зберігаються у поточному Cucumber World:
 * - `this.browser` — браузер;
 * - `this.page` — активна сторінка.
 *
 * @returns {Promise<void>}
 */
Before(async function () {
  this.browser = await chromium.launch({ headless: true });
  this.page = await this.browser.newPage();
});

/**
 * Хук, що виконується після кожного BDD-сценарію.
 *
 * Закриває браузер, якщо він був відкритий у хукy `Before`.
 * Це гарантує ізоляцію сценаріїв і звільнення ресурсів
 * після завершення тесту.
 *
 * @returns {Promise<void>}
 */
After(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});
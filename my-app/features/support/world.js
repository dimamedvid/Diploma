const { setWorldConstructor } = require("@cucumber/cucumber");

/**
 * Користувацький об'єкт World для Cucumber-сценаріїв.
 *
 * Цей клас використовується для зберігання спільного стану
 * між step definitions під час виконання одного BDD-сценарію.
 *
 * У поточній реалізації World містить:
 * - `browser` — екземпляр браузера Playwright;
 * - `page` — активну вкладку браузера, з якою працюють кроки тесту.
 *
 * Завдяки цьому step definitions можуть використовувати
 * `this.browser` і `this.page` для навігації, введення даних
 * та перевірки інтерфейсу.
 */
class CustomWorld {
  /**
   * Створює новий об'єкт World для окремого сценарію.
   *
   * Початково браузер і сторінка не ініціалізовані.
   * Їх створення відбувається у lifecycle hooks
   * перед початком виконання сценарію.
   */
  constructor() {
    /**
     * Екземпляр браузера Playwright.
     *
     * @type {import("playwright").Browser | null}
     */
    this.browser = null;

    /**
     * Активна сторінка браузера Playwright.
     *
     * @type {import("playwright").Page | null}
     */
    this.page = null;
  }
}

/**
 * Реєструє користувацький клас World у Cucumber.
 *
 * Після цього кожен сценарій отримує окремий екземпляр `CustomWorld`,
 * доступний у step definitions через `this`.
 */
setWorldConstructor(CustomWorld);
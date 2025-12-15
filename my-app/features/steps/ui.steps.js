const { Given, When, Then } = require("@cucumber/cucumber");

const BASE_URL = "http://localhost:3000";

Given('the user opens the application at {string}', async function (url) {
  await this.page.goto(url);
});

Given('the user is on the home page {string}', async function (url) {
  await this.page.goto(url);
});

When("the user navigates to the login page", async function () {
  await this.page.goto(`${BASE_URL}/login`);
});

When(
  "the user enters login {string} and password {string}",
  async function (login, password) {
    await this.page.fill('input[name="login"]', login);
    await this.page.fill('input[name="password"]', password);
  }
);

When("the user submits the login form", async function () {
  await this.page.click('button[type="submit"]');
});

Then("the user should be redirected to the home page", async function () {
  await this.page.waitForURL(`${BASE_URL}/`);
});

Then("the user should see the text {string}", async function (text) {
  await this.page.waitForSelector(`text=${text}`);
});

When("the user enters {string} into the search field", async function (query) {
  await this.page.fill(".filters__search", query);
});

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

const { Before, After } = require("@cucumber/cucumber");
const { chromium } = require("playwright");

Before(async function () {
  this.browser = await chromium.launch({ headless: true });
  this.page = await this.browser.newPage();
});

After(async function () {
  if (this.browser) await this.browser.close();
});

const { setWorldConstructor } = require("@cucumber/cucumber");

class CustomWorld {
  constructor() {
    this.browser = null;
    this.page = null;
  }
}

setWorldConstructor(CustomWorld);

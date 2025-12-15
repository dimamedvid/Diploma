module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["features/steps/**/*.js", "features/support/**/*.js"],
    format: [
      "progress",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json"
    ],
    publishQuiet: true
  }
};

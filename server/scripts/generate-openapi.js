const fs = require("fs");
const path = require("path");
const swaggerSpec = require("../docs/swagger");

const outDir = path.join(__dirname, "..", "docs", "api");
const outFile = path.join(outDir, "openapi.json");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(swaggerSpec, null, 2), "utf-8");

console.log(`OpenAPI specification generated: ${outFile}`);
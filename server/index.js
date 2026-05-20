require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/auth.routes");
const workRoutes = require("./routes/work.routes");
const commentRoutes = require("./routes/comment.routes");
const userActivityRoutes = require("./routes/userActivity.routes");
const swaggerSpec = require("./docs/swagger");
const requestContext = require("./middlewares/requestContext");
const requestLogger = require("./middlewares/requestLogger");
const errorHandler = require("./middlewares/errorHandler");
const { createModuleLogger } = require("./utils/logger");
const { checkDbConnection } = require("./utils/db");

const app = express();
const log = createModuleLogger("server");

app.use(cors({ origin: "http://localhost:3000", credentials: false }));

app.use(express.json());

app.use(requestContext);

app.use(requestLogger);

app.use("/api/auth", authRoutes);

app.use("/api/works", workRoutes);

app.use("/api/comments", commentRoutes);

app.use("/api/me", userActivityRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

/**
 * GET /api/health
 *
 * Технічний endpoint для перевірки доступності сервера та PostgreSQL.
 */
app.get("/api/health", async (req, res) => {
  log.debug("Health-check requested", {
    requestId: req.requestId,
  });

  const dbOk = await checkDbConnection();

  return res.json({
    ok: true,
    database: dbOk,
  });
});

app.use(errorHandler);

if (require.main === module) {
  const PORT = Number(process.env.PORT || 4000);

  const server = app.listen(PORT, () => {
    log.info(`API running on http://localhost:${PORT}`, {
      env: process.env.NODE_ENV || "development",
    });
  });

  const gracefulShutdown = (signal) => {
    log.info("Shutdown signal received", { signal });

    server.close(() => {
      log.info("Server stopped gracefully");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  process.on("uncaughtException", (error) => {
    log.critical("Uncaught exception", {
      errorMessage: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    log.critical("Unhandled promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
    process.exit(1);
  });
}

module.exports = app;
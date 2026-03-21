const { createLogger, format, transports } = require("winston");

const levels = {
  critical: 0,
  error: 1,
  warning: 2,
  info: 3,
  debug: 4,
};

const logger = createLogger({
  levels,
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, module, stack, ...meta }) => {
      const moduleName = module || "app";
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      const stackString = stack ? `\n${stack}` : "";

      return `${timestamp} [${level.toUpperCase()}] [${moduleName}] ${message}${metaString}${stackString}`;
    }),
  ),
  transports: [new transports.Console()],
});

/**
 * Створює модульний логер із фіксованою назвою модуля.
 *
 * Повертає набір методів для логування повідомлень
 * різних рівнів із автоматичним додаванням поля `module`.
 *
 * @param {string} moduleName - Назва модуля для логів.
 * @returns {Object} Об'єкт із методами debug, info, warning, error, critical.
 */
function createModuleLogger(moduleName) {
  return {
    debug(message, meta = {}) {
      logger.log({ level: "debug", message, module: moduleName, ...meta });
    },

    info(message, meta = {}) {
      logger.log({ level: "info", message, module: moduleName, ...meta });
    },

    warning(message, meta = {}) {
      logger.log({ level: "warning", message, module: moduleName, ...meta });
    },

    error(message, meta = {}) {
      logger.log({ level: "error", message, module: moduleName, ...meta });
    },

    critical(message, meta = {}) {
      logger.log({ level: "critical", message, module: moduleName, ...meta });
    },
  };
}

module.exports = {
  logger,
  createModuleLogger,
};
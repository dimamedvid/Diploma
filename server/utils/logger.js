const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

/**
 * Каталог для зберігання логів.
 *
 * Якщо каталог відсутній, він буде створений автоматично.
 */
const logsDir = path.join(__dirname, "..", "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Кастомні рівні логування для серверної частини.
 *
 * Менше число = вищий пріоритет.
 */
const levels = {
  critical: 0,
  error: 1,
  warning: 2,
  info: 3,
  debug: 4,
};

/**
 * Формат серіалізації об'єкта meta для читабельного виводу.
 *
 * @param {Object} meta - Додаткові поля логу.
 * @returns {string} Рядок з JSON-даними або порожній рядок.
 */
function formatMeta(meta) {
  return Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
}

/**
 * Базовий формат логів для консолі та файлів.
 *
 * Містить:
 * - timestamp;
 * - рівень;
 * - модуль;
 * - повідомлення;
 * - додатковий контекст;
 * - stack trace, якщо він є.
 */
const baseFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, module, stack, ...meta }) => {
    const moduleName = module || "app";
    const stackString = stack ? `\n${stack}` : "";

    return `${timestamp} [${level.toUpperCase()}] [${moduleName}] ${message}${formatMeta(meta)}${stackString}`;
  }),
);

/**
 * Консольний transport для розробки та швидкої діагностики.
 */
const consoleTransport = new transports.Console({
  level: process.env.LOG_LEVEL || "info",
});

/**
 * Ротаційний transport для всіх логів.
 *
 * Новий файл створюється щодня.
 * Додатково вмикається ротація за розміром.
 */
const combinedRotateTransport = new DailyRotateFile({
  level: process.env.LOG_LEVEL || "info",
  dirname: logsDir,
  filename: "application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "5m",
  maxFiles: "14d",
});

/**
 * Ротаційний transport тільки для помилок.
 */
const errorRotateTransport = new DailyRotateFile({
  level: "error",
  dirname: logsDir,
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "5m",
  maxFiles: "30d",
});

/**
 * Логер застосунку.
 *
 * Використовує:
 * - консоль;
 * - файл загальних логів;
 * - окремий файл для помилок.
 */
const logger = createLogger({
  levels,
  level: process.env.LOG_LEVEL || "info",
  format: baseFormat,
  transports: [
    consoleTransport,
    combinedRotateTransport,
    errorRotateTransport,
  ],
});

/**
 * Обробка помилок файлових transport-ів.
 *
 * Це дозволяє уникнути "тихих" збоїв при записі логів у файл.
 */
combinedRotateTransport.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Combined log transport error:", error);
});

errorRotateTransport.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Error log transport error:", error);
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
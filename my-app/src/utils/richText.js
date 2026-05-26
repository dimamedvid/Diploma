/**
 * Рендерить inline-форматування тексту.
 *
 * Підтримує:
 * **жирний текст**
 * курсивний текст*
 *
 * @param {string} text - Текст для форматування.
 * @returns {Array<string|JSX.Element>} Масив текстових фрагментів і JSX.
 */
function renderInlineFormatting(text) {
  const source = String(text || "");
  const parts = source.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

/**
 * Розбиває текст на абзаци та застосовує форматування.
 *
 * @param {string} text - Текст сторінки твору.
 * @returns {JSX.Element[]} Масив абзаців.
 */
export function renderFormattedParagraphs(text) {
  return String(text || "")
    .split("\n\n")
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index}>{renderInlineFormatting(paragraph)}</p>
    ));
}
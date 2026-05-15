import "./WorkCard.css";

/**
 * Повертає символ зірки для конкретної позиції рейтингу.
 *
 * @param {number} index - Позиція зірки.
 * @param {number} full - Кількість повних зірок.
 * @param {boolean} half - Чи є половинна зірка.
 * @returns {string} Символ рейтингу.
 */
function getStarSymbol(index, full, half) {
  if (index <= full) {
    return "★";
  }

  if (index === full + 1 && half) {
    return "⯨";
  }

  return "☆";
}

/**
 * Компонент відображення рейтингу у вигляді зірок.
 *
 * @param {{ value: number }} props - Властивості компонента.
 * @returns {JSX.Element} Візуальне відображення рейтингу.
 */
function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <span className="work-card__stars">
      {[1, 2, 3, 4, 5]
        .map((index) => getStarSymbol(index, full, half))
        .join(" ")}
    </span>
  );
}

/**
 * Картка твору для відображення в каталозі.
 *
 * @param {{ work: Object }} props - Властивості компонента.
 * @returns {JSX.Element} Картка твору.
 */
export default function WorkCard({ work }) {
  const ratingValue = Number(work.rating || 0);
  const ratingsCount = Number(work.ratingsCount || 0);

  return (
    <article className="work-card">
      <div className="work-card__cover-wrapper">
        <img className="work-card__cover" src={work.cover} alt={work.title} />
      </div>

      <div className="work-card__body">
        <h3 className="work-card__title">{work.title}</h3>
        <div className="work-card__author">{work.author}</div>
        <div className="work-card__genre">{work.genre}</div>

        <div className="work-card__rating">
          <Stars value={ratingValue} />

          <span className="work-card__rating-value">
            {ratingValue > 0 ? ratingValue.toFixed(1) : "—"}
          </span>
        </div>

        <span className="work-card__rating-count">
          {ratingsCount > 0
            ? `Оцінок користувачів: ${ratingsCount}`
            : "Оцінок користувачів ще немає"}
        </span>

        <p className="work-card__description">{work.description}</p>

        <a className="work-card__button" href={`/works/${work.id}`}>
          Детальніше
        </a>
      </div>
    </article>
  );
}
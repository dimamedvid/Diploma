import "./WorkCard.css";

/**
 * Допоміжний компонент для візуального відображення рейтингу твору у вигляді зірок.
 *
 * Компонент перетворює числове значення рейтингу на набір символів:
 * - повна зірка для цілої частини рейтингу;
 * - половина зірки, якщо дробова частина не менша за 0.5;
 * - порожня зірка для решти позицій до 5.
 *
 * @param {object} props - Властивості компонента.
 * @param {number} props.value - Числове значення рейтингу твору.
 * @returns {JSX.Element} Відображення рейтингу у вигляді зірок.
 */
function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <span className="work-card__stars">
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= full) {
          return "★ ";
        }
        if (i === full + 1 && half) {
          return "⯨ ";
        }
        return "☆ ";
      })}
    </span>
  );
}

/**
 * Картка окремого літературного твору.
 *
 * Компонент відображає основну інформацію про твір:
 * - обкладинку;
 * - назву;
 * - автора;
 * - рейтинг;
 * - короткий опис;
 * - кнопку переходу до детальнішої інформації.
 *
 * Для показу рейтингу використовується допоміжний компонент `Stars`.
 *
 * @param {object} props - Властивості компонента.
 * @param {object} props.work - Об'єкт літературного твору.
 * @param {string|number} props.work.id - Унікальний ідентифікатор твору.
 * @param {string} props.work.title - Назва твору.
 * @param {string} props.work.author - Автор твору.
 * @param {string} props.work.cover - Шлях або URL до зображення обкладинки.
 * @param {number} props.work.rating - Середній рейтинг твору.
 * @param {string} props.work.description - Короткий опис твору.
 * @returns {JSX.Element} Картка літературного твору.
 */
export default function WorkCard(props) {
  const { work } = props;

  return (
    <article className="work-card">
      <div className="work-card__cover-wrapper">
        <img
          className="work-card__cover"
          src={work.cover}
          alt={work.title}
        />
      </div>

      <div className="work-card__body">
        <h3 className="work-card__title">{work.title}</h3>
        <div className="work-card__author">{work.author}</div>

        <div className="work-card__rating">
          <Stars value={work.rating} />
          <span className="work-card__rating-value">
            {work.rating.toFixed(1)}
          </span>
        </div>

        <p className="work-card__description">
          {work.description}
        </p>

        <button className="work-card__button">
          Детальніше
        </button>
      </div>
    </article>
  );
}
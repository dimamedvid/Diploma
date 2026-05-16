import "./FiltersBar.css";

/**
 * Панель фільтрації та сортування каталогу творів.
 *
 * Дозволяє виконувати пошук, фільтрувати твори за жанром,
 * діапазоном рейтингу та змінювати порядок сортування.
 *
 * @param {Object} props - Властивості компонента.
 * @param {string} props.query - Пошуковий запит.
 * @param {Function} props.onQueryChange - Функція зміни пошукового запиту.
 * @param {string} props.genre - Поточний жанр.
 * @param {Function} props.onGenreChange - Функція зміни жанру.
 * @param {string[]} props.genres - Доступні жанри.
 * @param {string} props.ratingMin - Мінімальний рейтинг.
 * @param {Function} props.onRatingMinChange - Функція зміни мінімального рейтингу.
 * @param {string} props.ratingMax - Максимальний рейтинг.
 * @param {Function} props.onRatingMaxChange - Функція зміни максимального рейтингу.
 * @param {string} props.sortOption - Поточний тип сортування.
 * @param {Function} props.onSortOptionChange - Функція зміни сортування.
 * @returns {JSX.Element} Панель фільтрів.
 */
export default function FiltersBar({
  query,
  onQueryChange,
  genre,
  onGenreChange,
  genres,
  ratingMin,
  onRatingMinChange,
  ratingMax,
  onRatingMaxChange,
  sortOption,
  onSortOptionChange,
}) {
  return (
    <section className="filters">
      <div className="filters__field filters__field--wide">
        <label className="filters__label" htmlFor="search">
          Пошук
        </label>

        <input
          className="filters__input"
          id="search"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Пошук за назвою, автором, жанром або описом"
        />
      </div>

      <div className="filters__field">
        <label className="filters__label" htmlFor="genre">
          Жанр
        </label>

        <select
          className="filters__select"
          id="genre"
          value={genre}
          onChange={(event) => onGenreChange(event.target.value)}
        >
          {genres.map((genreName) => (
            <option key={genreName} value={genreName}>
              {genreName}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__field">
        <label className="filters__label" htmlFor="rating-min">
          Рейтинг від
        </label>

        <select
          className="filters__select"
          id="rating-min"
          value={ratingMin}
          onChange={(event) => onRatingMinChange(event.target.value)}
        >
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>

      <div className="filters__field">
        <label className="filters__label" htmlFor="rating-max">
          Рейтинг до
        </label>

        <select
          className="filters__select"
          id="rating-max"
          value={ratingMax}
          onChange={(event) => onRatingMaxChange(event.target.value)}
        >
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
          <option value="0">0</option>
        </select>
      </div>

      <div className="filters__field">
        <label className="filters__label" htmlFor="sort">
          Сортування
        </label>

        <select
          className="filters__select"
          id="sort"
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value)}
        >
          <option value="recommended">Рекомендовані</option>
          <option value="rating-desc">За рейтингом</option>
          <option value="title-asc">За назвою</option>
          <option value="author-asc">За автором</option>
          <option value="newest">Нові спочатку</option>
          <option value="oldest">Старі спочатку</option>
        </select>
      </div>
    </section>
  );
}
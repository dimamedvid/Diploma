import "./FiltersBar.css";

/**
 * Панель пошуку та фільтрації літературних творів.
 *
 * Компонент відображає елементи керування для:
 * - пошуку творів за назвою;
 * - вибору жанру;
 * - вибору мінімального рейтингу;
 * - вибору максимального рейтингу.
 *
 * Усі значення та функції зміни стану передаються з батьківського
 * компонента, тому `FiltersBar` є керованим презентаційним компонентом.
 *
 * @param {Object} props - Властивості компонента.
 * @param {string} props.query - Поточний текст пошукового запиту.
 * @param {Function} props.onQueryChange - Функція зміни пошукового запиту.
 * @param {string} props.genre - Поточне значення вибраного жанру.
 * @param {Function} props.onGenreChange - Функція зміни жанру.
 * @param {string[]} props.genres - Список доступних жанрів.
 * @param {string|number} props.ratingMin - Поточне значення мінімального рейтингу.
 * @param {Function} props.onRatingMinChange - Функція зміни мінімального рейтингу.
 * @param {string|number} props.ratingMax - Поточне значення максимального рейтингу.
 * @param {Function} props.onRatingMaxChange - Функція зміни максимального рейтингу.
 * @returns {JSX.Element} Панель фільтрів і пошуку.
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
}) {
  return (
    <section className="filters" aria-label="Фільтри пошуку">
      <input
        className="filters__search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Пошук за назвою"
        aria-label="Пошук за назвою"
      />

      <div className="filters__header">
        <span className="filters__title">Фільтри</span>
      </div>

      <div className="filters__grid">
        <div className="filters__field">
          <label className="filters__label" htmlFor="filters-genre">
            Жанр
          </label>
          <select
            id="filters-genre"
            className="filters__select"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label className="filters__label" htmlFor="filters-rating-min">
            Мін. рейтинг
          </label>
          <select
            id="filters-rating-min"
            className="filters__select"
            value={ratingMin}
            onChange={(e) => onRatingMinChange(e.target.value)}
          >
            <option value="Будь-який">Будь-який</option>
            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label className="filters__label" htmlFor="filters-rating-max">
            Макс. рейтинг
          </label>
          <select
            id="filters-rating-max"
            className="filters__select"
            value={ratingMax}
            onChange={(e) => onRatingMaxChange(e.target.value)}
          >
            <option value="Будь-який">Будь-який</option>
            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
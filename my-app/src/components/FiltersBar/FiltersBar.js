import "./FiltersBar.css";

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

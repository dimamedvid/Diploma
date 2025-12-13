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
  onRatingMaxChange
}) {
  return (
    <section className="filters">
      <input
        className="filters__search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Пошук за назвою"
      />

      <div className="filters__header">
        <span className="filters__title">Фільтри</span>
      </div>

      <div className="filters__grid">
        <div className="filters__field">
          <label className="filters__label">Жанр</label>
          <select
            className="filters__select"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
          >
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label className="filters__label">Мін. рейтинг</label>
          <select
            className="filters__select"
            value={ratingMin}
            onChange={(e) => onRatingMinChange(e.target.value)}
          >
            <option value="Будь-який">Будь-який</option>
            {[0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label className="filters__label">Макс. рейтинг</label>
          <select
            className="filters__select"
            value={ratingMax}
            onChange={(e) => onRatingMaxChange(e.target.value)}
          >
            <option value="Будь-який">Будь-який</option>
            {[0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

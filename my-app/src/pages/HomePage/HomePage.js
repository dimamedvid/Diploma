import { useMemo, useState } from "react";
import worksData from "../../data/works.json";

import FiltersBar from "../../components/FiltersBar/FiltersBar";
import WorksGrid from "../../components/WorksGrid/WorksGrid";

import "./HomePage.css";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Всі жанри");
  const [ratingMin, setRatingMin] = useState("Будь-який");
  const [ratingMax, setRatingMax] = useState("Будь-який");

  const genres = useMemo(() => {
    return ["Всі жанри", ...new Set(worksData.map(w => w.genre))];
  }, []);

  const filteredWorks = useMemo(() => {
    const q = query.toLowerCase();
    const min = ratingMin === "Будь-який" ? 0 : Number(ratingMin);
    const max = ratingMax === "Будь-який" ? 5 : Number(ratingMax);

    return worksData.filter(w =>
      w.title.toLowerCase().includes(q) &&
      (genre === "Всі жанри" || w.genre === genre) &&
      w.rating >= min &&
      w.rating <= max
    );
  }, [query, genre, ratingMin, ratingMax]);

  return (
    <section className="home">
      <FiltersBar
        query={query}
        onQueryChange={setQuery}
        genre={genre}
        onGenreChange={setGenre}
        genres={genres}
        ratingMin={ratingMin}
        onRatingMinChange={setRatingMin}
        ratingMax={ratingMax}
        onRatingMaxChange={setRatingMax}
      />

      <div className="results">
        <h2 className="results__title">Результати пошуку</h2>
        <span className="results__count">
          Знайдено: {filteredWorks.length}
        </span>
      </div>

      <WorksGrid works={filteredWorks} />
    </section>
  );
}

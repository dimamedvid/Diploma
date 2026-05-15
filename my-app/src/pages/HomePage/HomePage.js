import { useMemo, useState } from "react";
import FiltersBar from "../../components/FiltersBar/FiltersBar";
import WorksGrid from "../../components/WorksGrid/WorksGrid";
import worksData from "../../data/works.json";
import {
  enrichWorksWithRating,
  getAllPublishedWorks,
} from "../../utils/worksStorage";
import "./HomePage.css";

/**
 * Головна сторінка каталогу творів.
 *
 * Відображає список опублікованих творів,
 * підтримує пошук, фільтрацію за жанром і рейтингом.
 *
 * @returns {JSX.Element} Головна сторінка з каталогом творів.
 */
export default function HomePage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Всі жанри");
  const [ratingMin, setRatingMin] = useState("0");
  const [ratingMax, setRatingMax] = useState("5");

  const allWorks = useMemo(() => {
    const publishedWorks = getAllPublishedWorks(worksData);

    return enrichWorksWithRating(publishedWorks);
  }, []);

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(allWorks.map((work) => work.genre))];

    return ["Всі жанри", ...uniqueGenres];
  }, [allWorks]);

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = Number(ratingMin);
    const max = Number(ratingMax);

    return allWorks.filter(
      (work) =>
        work.title.toLowerCase().includes(q) &&
        (genre === "Всі жанри" || work.genre === genre) &&
        work.rating >= min &&
        work.rating <= max,
    );
  }, [allWorks, query, genre, ratingMin, ratingMax]);

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
        <span className="results__count">Знайдено: {filteredWorks.length}</span>
      </div>

      <WorksGrid works={filteredWorks} />
    </section>
  );
}
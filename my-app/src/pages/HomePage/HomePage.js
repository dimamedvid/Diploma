import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import FiltersBar from "../../components/FiltersBar/FiltersBar";
import WorksGrid from "../../components/WorksGrid/WorksGrid";
import worksData from "../../data/works.json";
import {
  enrichWorksWithRating,
  getAllPublishedWorks,
  getUserId,
  readFromStorage,
} from "../../utils/worksStorage";
import "./HomePage.css";

const FAVORITE_GENRES_STORAGE_KEY = "favoriteGenresByUser";

/**
 * Повертає улюблені жанри поточного користувача.
 *
 * @param {Object|null} user - Дані поточного користувача.
 * @returns {string[]} Масив улюблених жанрів.
 */
function getFavoriteGenresForUser(user) {
  if (!user) {
    return [];
  }

  const favoriteGenresByUser = readFromStorage(FAVORITE_GENRES_STORAGE_KEY, {});
  const userId = getUserId(user);

  return favoriteGenresByUser[userId] || [];
}

/**
 * Сортує твори так, щоб твори з улюблених жанрів користувача були першими.
 *
 * @param {Object[]} works - Список творів.
 * @param {string[]} favoriteGenres - Улюблені жанри користувача.
 * @returns {Object[]} Відсортований список творів.
 */
function sortWorksByFavoriteGenres(works, favoriteGenres) {
  if (favoriteGenres.length === 0) {
    return works;
  }

  return [...works].sort((firstWork, secondWork) => {
    const firstMatches = favoriteGenres.includes(firstWork.genre);
    const secondMatches = favoriteGenres.includes(secondWork.genre);

    if (firstMatches === secondMatches) {
      return 0;
    }

    return firstMatches ? -1 : 1;
  });
}

/**
 * Головна сторінка каталогу творів.
 *
 * Відображає список опублікованих творів,
 * підтримує пошук, фільтрацію за жанром і рейтингом.
 * Якщо користувач обрав улюблені жанри, відповідні твори показуються першими.
 *
 * @returns {JSX.Element} Головна сторінка з каталогом творів.
 */
export default function HomePage() {
  const { user } = useSelector((state) => state.auth);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Всі жанри");
  const [ratingMin, setRatingMin] = useState("0");
  const [ratingMax, setRatingMax] = useState("5");

  const favoriteGenres = useMemo(() => {
    return getFavoriteGenresForUser(user);
  }, [user]);

  const allWorks = useMemo(() => {
    const publishedWorks = getAllPublishedWorks(worksData);
    const worksWithRating = enrichWorksWithRating(publishedWorks);

    return sortWorksByFavoriteGenres(worksWithRating, favoriteGenres);
  }, [favoriteGenres]);

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
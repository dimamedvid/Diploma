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
 * Перевіряє, чи твір відповідає пошуковому запиту.
 *
 * Пошук виконується за назвою, автором, жанром і описом.
 *
 * @param {Object} work - Твір.
 * @param {string} query - Пошуковий запит.
 * @returns {boolean} true, якщо твір відповідає запиту.
 */
function doesWorkMatchQuery(work, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    work.title,
    work.author,
    work.genre,
    work.description,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

/**
 * Повертає часову мітку твору для сортування.
 *
 * Для користувацьких творів використовується id, бо він створюється через Date.now().
 * Для базових творів використовується id з works.json.
 *
 * @param {Object} work - Твір.
 * @returns {number} Числове значення для сортування.
 */
function getWorkDateValue(work) {
  return Number(work.id) || 0;
}

/**
 * Сортує твори за вибраним критерієм.
 *
 * @param {Object[]} works - Список творів.
 * @param {string} sortOption - Тип сортування.
 * @param {string[]} favoriteGenres - Улюблені жанри користувача.
 * @returns {Object[]} Відсортований список творів.
 */
function sortWorks(works, sortOption, favoriteGenres) {
  return [...works].sort((firstWork, secondWork) => {
    if (sortOption === "recommended") {
      const firstMatches = favoriteGenres.includes(firstWork.genre);
      const secondMatches = favoriteGenres.includes(secondWork.genre);

      if (firstMatches !== secondMatches) {
        return firstMatches ? -1 : 1;
      }

      return Number(secondWork.rating || 0) - Number(firstWork.rating || 0);
    }

    if (sortOption === "rating-desc") {
      return Number(secondWork.rating || 0) - Number(firstWork.rating || 0);
    }

    if (sortOption === "title-asc") {
      return firstWork.title.localeCompare(secondWork.title, "uk");
    }

    if (sortOption === "author-asc") {
      return firstWork.author.localeCompare(secondWork.author, "uk");
    }

    if (sortOption === "newest") {
      return getWorkDateValue(secondWork) - getWorkDateValue(firstWork);
    }

    if (sortOption === "oldest") {
      return getWorkDateValue(firstWork) - getWorkDateValue(secondWork);
    }

    return 0;
  });
}

/**
 * Головна сторінка каталогу творів.
 *
 * Відображає список опублікованих творів,
 * підтримує пошук, фільтрацію за жанром і рейтингом,
 * персоналізоване сортування та додаткові варіанти сортування.
 *
 * @returns {JSX.Element} Головна сторінка з каталогом творів.
 */
export default function HomePage() {
  const { user } = useSelector((state) => state.auth);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Всі жанри");
  const [ratingMin, setRatingMin] = useState("0");
  const [ratingMax, setRatingMax] = useState("5");
  const [sortOption, setSortOption] = useState("recommended");

  const favoriteGenres = useMemo(() => {
    return getFavoriteGenresForUser(user);
  }, [user]);

  const allWorks = useMemo(() => {
    const publishedWorks = getAllPublishedWorks(worksData);

    return enrichWorksWithRating(publishedWorks);
  }, []);

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(allWorks.map((work) => work.genre))];

    return ["Всі жанри", ...uniqueGenres];
  }, [allWorks]);

  const filteredWorks = useMemo(() => {
    const min = Number(ratingMin);
    const max = Number(ratingMax);

    const filtered = allWorks.filter(
      (work) =>
        doesWorkMatchQuery(work, query) &&
        (genre === "Всі жанри" || work.genre === genre) &&
        work.rating >= min &&
        work.rating <= max,
    );

    return sortWorks(filtered, sortOption, favoriteGenres);
  }, [allWorks, query, genre, ratingMin, ratingMax, sortOption, favoriteGenres]);

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
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
      />

      <div className="results">
        <div>
          <h2 className="results__title">Результати пошуку</h2>

          {favoriteGenres.length > 0 && sortOption === "recommended" && (
            <p className="results__hint">
              Спочатку показуються твори з ваших улюблених жанрів:{" "}
              {favoriteGenres.join(", ")}.
            </p>
          )}
        </div>

        <span className="results__count">Знайдено: {filteredWorks.length}</span>
      </div>

      <WorksGrid works={filteredWorks} />
    </section>
  );
}
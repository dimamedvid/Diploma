import { useMemo, useState } from "react";
import worksData from "../../data/works.json";

import FiltersBar from "../../components/FiltersBar/FiltersBar";
import WorksGrid from "../../components/WorksGrid/WorksGrid";

import "./HomePage.css";

/**
 * Головна сторінка системи для перегляду, пошуку та фільтрації літературних творів.
 *
 * Компонент зберігає локальний стан пошукового запиту та вибраних фільтрів,
 * формує перелік доступних жанрів на основі наявних даних і обчислює
 * підсумковий список творів для відображення.
 *
 * Логіка фільтрації включає:
 * - пошук за назвою твору без урахування регістру;
 * - фільтрацію за жанром;
 * - фільтрацію за мінімальним і максимальним рейтингом.
 *
 * Для оптимізації обчислень використовується `useMemo`,
 * щоб уникнути повторного формування списків при кожному рендері.
 *
 * @returns {JSX.Element} Головна сторінка з панеллю фільтрів,
 * лічильником знайдених результатів і сіткою творів.
 */
export default function HomePage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Всі жанри");
  const [ratingMin, setRatingMin] = useState("Будь-який");
  const [ratingMax, setRatingMax] = useState("Будь-який");

  /**
   * Формує список доступних жанрів для фільтра.
   *
   * До результату завжди додається значення "Всі жанри",
   * а інші жанри беруться унікально з локального набору творів.
   *
   * @type {string[]}
   */
  const genres = useMemo(() => {
    return ["Всі жанри", ...new Set(worksData.map((w) => w.genre))];
  }, []);

  /**
   * Обчислює список творів, що відповідають введеним критеріям пошуку.
   *
   * Алгоритм:
   * 1. Нормалізує текст пошукового запиту до нижнього регістру.
   * 2. Перетворює значення рейтингу у числовий діапазон.
   * 3. Відбирає твори за назвою, жанром і межами рейтингу.
   *
   * @type {Object[]}
   */
  const filteredWorks = useMemo(() => {
    const q = query.toLowerCase();
    const min = ratingMin === "Будь-який" ? 0 : Number(ratingMin);
    const max = ratingMax === "Будь-який" ? 5 : Number(ratingMax);

    return worksData.filter(
      (w) =>
        w.title.toLowerCase().includes(q) &&
        (genre === "Всі жанри" || w.genre === genre) &&
        w.rating >= min &&
        w.rating <= max,
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
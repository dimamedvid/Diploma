import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "../HomePage";
import worksData from "../../../data/works.json";

/**
 * Допоміжна функція для пошуку елемента `<select>`
 * у блоці фільтрації за текстом його мітки.
 *
 * Використовується в тестах для доступу до полів вибору жанру
 * та меж рейтингу без прив'язки до конкретної внутрішньої
 * структури компонента поза межами блоку `.filters__field`.
 *
 * @param {string} labelText - Текст мітки поля фільтра.
 * @returns {HTMLSelectElement} Елемент `<select>`, пов'язаний із вказаною міткою.
 * @throws {Error} Якщо контейнер поля або сам `<select>` не знайдено.
 */
function getSelectByFieldLabel(labelText) {
  const label = screen.getByText(labelText);

  const field = label.closest(".filters__field");
  if (!field) {
    throw new Error(`Не знайдено контейнер .filters__field для label: ${labelText}`);
  }

  const select = field.querySelector("select");
  if (!select) {
    throw new Error(`Не знайдено <select> у полі: ${labelText}`);
  }

  return select;
}

/**
 * Набір UI-тестів для перевірки логіки пошуку та фільтрації на головній сторінці.
 *
 * Тести перевіряють:
 * - початкове відображення кількості всіх творів;
 * - пошук за назвою без урахування регістру;
 * - фільтрацію за жанром;
 * - фільтрацію за діапазоном рейтингу.
 *
 * Ці тести виступають прикладом "живої документації",
 * оскільки формально описують очікувану поведінку інтерфейсу
 * при взаємодії користувача з елементами пошуку і фільтрів.
 */
describe("HomePage search / filter requirements", () => {
  /**
   * Перевіряє, що після початкового рендеру сторінка
   * відображає повну кількість творів із локального набору даних.
   */
  test("shows all works count by default", () => {
    render(<HomePage />);
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${worksData.length}`))).toBeInTheDocument();
  });

  /**
   * Перевіряє, що пошук за назвою:
   * - працює за входженням підрядка;
   * - не залежить від регістру символів.
   */
  test("search by title is case-insensitive substring", () => {
    render(<HomePage />);

    const sampleTitle = worksData[0].title;
    const q = sampleTitle.slice(0, Math.min(4, sampleTitle.length)).toLowerCase();

    const input = screen.getByPlaceholderText("Пошук за назвою");
    fireEvent.change(input, { target: { value: q } });

    const expected = worksData.filter((w) => w.title.toLowerCase().includes(q)).length;
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${expected}`))).toBeInTheDocument();
  });

  /**
   * Перевіряє, що після вибору жанру
   * у результатах залишаються лише твори цього жанру.
   */
  test("genre filter: choosing a genre shows only that genre", () => {
    render(<HomePage />);

    const anyGenre =
      worksData.find((w) => w.genre && w.genre !== "Всі жанри")?.genre || worksData[0].genre;

    const genreSelect = getSelectByFieldLabel("Жанр");
    fireEvent.change(genreSelect, { target: { value: anyGenre } });

    const expected = worksData.filter((w) => w.genre === anyGenre).length;
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${expected}`))).toBeInTheDocument();
  });

  /**
   * Перевіряє, що фільтрація за мінімальним і максимальним рейтингом
   * працює у включному діапазоні значень.
   */
  test("rating min/max filters: works within inclusive range", () => {
    render(<HomePage />);

    const minSelect = getSelectByFieldLabel("Мін. рейтинг");
    const maxSelect = getSelectByFieldLabel("Макс. рейтинг");

    fireEvent.change(minSelect, { target: { value: "4" } });
    fireEvent.change(maxSelect, { target: { value: "5" } });

    const expected = worksData.filter((w) => w.rating >= 4 && w.rating <= 5).length;
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${expected}`))).toBeInTheDocument();
  });
});
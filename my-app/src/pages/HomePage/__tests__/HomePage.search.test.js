import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import HomePage from "../HomePage";
import worksData from "../../../data/works.json";

function getSelectByFieldLabel(labelText) {
  const label = screen.getByText(labelText);

  const field = label.closest(".filters__field");
  if (!field) throw new Error(`Не знайдено контейнер .filters__field для label: ${labelText}`);

  const select = field.querySelector("select");
  if (!select) throw new Error(`Не знайдено <select> у полі: ${labelText}`);

  return select;
}

describe("HomePage search / filter requirements", () => {
  test("shows all works count by default", () => {
    render(<HomePage />);
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${worksData.length}`))).toBeInTheDocument();
  });

  test("search by title is case-insensitive substring", () => {
    render(<HomePage />);

    const sampleTitle = worksData[0].title;
    const q = sampleTitle.slice(0, Math.min(4, sampleTitle.length)).toLowerCase();

    const input = screen.getByPlaceholderText("Пошук за назвою");
    fireEvent.change(input, { target: { value: q } });

    const expected = worksData.filter((w) => w.title.toLowerCase().includes(q)).length;
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${expected}`))).toBeInTheDocument();
  });

  test("genre filter: choosing a genre shows only that genre", () => {
    render(<HomePage />);

    const anyGenre =
      worksData.find((w) => w.genre && w.genre !== "Всі жанри")?.genre || worksData[0].genre;

    const genreSelect = getSelectByFieldLabel("Жанр");
    fireEvent.change(genreSelect, { target: { value: anyGenre } });

    const expected = worksData.filter((w) => w.genre === anyGenre).length;
    expect(screen.getByText(new RegExp(`Знайдено:\\s*${expected}`))).toBeInTheDocument();
  });

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

import WorkCard from "../WorkCard/WorkCard";
import "./WorksGrid.css";

/**
 * Компонент для відображення сітки літературних творів.
 *
 * Приймає масив творів і відображає їх у вигляді списку карток
 * за допомогою компонента `WorkCard`.
 *
 * Якщо масив порожній, компонент показує повідомлення
 * про відсутність результатів пошуку.
 *
 * @param {Object} props - Властивості компонента.
 * @param {Object[]} props.works - Масив творів для відображення.
 * @returns {JSX.Element} Сітка карток творів або повідомлення про відсутність результатів.
 */
export default function WorksGrid({ works }) {
  if (!works.length) {
    return (
      <div className="works">
        <div className="works__empty">
          Нічого не знайдено. Спробуй змінити критерії.
        </div>
      </div>
    );
  }

  return (
    <section className="works">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </section>
  );
}
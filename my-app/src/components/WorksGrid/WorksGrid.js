import WorkCard from "../WorkCard/WorkCard";
import "./WorksGrid.css";

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
      {works.map(work => (
        <WorkCard key={work.id} work={work} />
      ))}
    </section>
  );
}

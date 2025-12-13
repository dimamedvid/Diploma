import "./WorkCard.css";

function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <span className="work-card__stars">
      {[1, 2, 3, 4, 5].map(i => {
        if (i <= full) return "★ ";
        if (i === full + 1 && half) return "⯨ ";
        return "☆ ";
      })}
    </span>
  );
}

export default function WorkCard({ work }) {
  return (
    <article className="work-card">
      <div className="work-card__cover-wrapper">
        <img
          className="work-card__cover"
          src={work.cover}
          alt={work.title}
        />
      </div>

      <div className="work-card__body">
        <h3 className="work-card__title">{work.title}</h3>
        <div className="work-card__author">{work.author}</div>

        <div className="work-card__rating">
          <Stars value={work.rating} />
          <span className="work-card__rating-value">
            {work.rating.toFixed(1)}
          </span>
        </div>

        <p className="work-card__description">
          {work.description}
        </p>

        <button className="work-card__button">
          Детальніше
        </button>
      </div>
    </article>
  );
}

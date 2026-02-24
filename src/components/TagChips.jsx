import './TagChips.css';

export default function TagChips({ tags = [] }) {
    if (!tags || tags.length === 0) {
        return (
            <div className="tag-chips-empty">
                Нет тегов
            </div>
        );
    }

    return (
        <div className="tag-chips">
            {tags.map((tag, i) => (
                <span key={i} className="tag-chip">
                    {tag}
                </span>
            ))}
        </div>
    );
}

import './TagChips.css';

export default function TagChips({ tags = [], onRemove, showRemoveButton = false }) {
    const normalizedTags = (tags || [])
        .map((tag, index) => {
            if (typeof tag === 'string') {
                return {
                    key: `${tag}-${index}`,
                    label: tag,
                };
            }

            const label = tag?.name || tag?.slug;
            if (!label) return null;

            return {
                key: tag?.id || tag?.slug || `${label}-${index}`,
                id: tag?.id,
                label,
            };
        })
        .filter(Boolean);

    if (normalizedTags.length === 0) {
        return <div className="tag-chips-empty">Нет тегов</div>;
    }

    return (
        <div className="tag-chips">
            {normalizedTags.map((tag) => (
                <span key={tag.key} className="tag-chip">
                    {tag.label}
                    {showRemoveButton && onRemove && (
                        <button
                            className="tag-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRemove(tag.id || tag.key);
                            }}
                            title="Удалить тег"
                        >
                            &times;
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
}


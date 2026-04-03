import './TagChips.css';

export default function TagChips({ tags = [], onRemove, showRemoveButton = false }) {
    const resolveVariant = (rawTag) => {
        const source = String(
            rawTag?.variant
            || rawTag?.category
            || rawTag?.type
            || rawTag?.status
            || rawTag?.severity
            || rawTag?.slug
            || rawTag?.name
            || '',
        ).toLowerCase();

        if (source.includes('danger') || source.includes('blocked') || source.includes('ban') || source.includes('nsfw')) {
            return 'danger';
        }
        if (source.includes('success') || source.includes('active') || source.includes('approved')) {
            return 'success';
        }
        if (source.includes('warning') || source.includes('pending') || source.includes('beta')) {
            return 'warning';
        }
        if (source.includes('muted') || source.includes('draft') || source.includes('inactive')) {
            return 'muted';
        }
        return 'default';
    };

    const normalizedTags = (tags || [])
        .map((tag, index) => {
            if (typeof tag === 'string') {
                return {
                    key: `${tag}-${index}`,
                    label: tag,
                    variant: 'default',
                };
            }

            const label = tag?.name || tag?.slug;
            if (!label) return null;

            return {
                key: tag?.id || tag?.slug || `${label}-${index}`,
                id: tag?.id,
                label,
                variant: resolveVariant(tag),
            };
        })
        .filter(Boolean);

    if (normalizedTags.length === 0) {
        return <div className="tag-chips-empty">Нет тегов</div>;
    }

    return (
        <div className="tag-chips">
            {normalizedTags.map((tag) => (
                <span key={tag.key} className="tag-chip" data-variant={tag.variant}>
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


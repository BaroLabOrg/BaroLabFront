import './TagChips.css';

const CATEGORY_VARIANTS = {
    SECURITY: 'security',
    LIFE: 'life',
    ENGINEERING: 'engineering',
    META: 'meta',
    INFO: 'info',
};

export default function TagChips({ tags = [], onRemove, showRemoveButton = false }) {
    const resolveVariant = (rawTag) => {
        // If backend category is present, use it directly
        if (rawTag?.category && CATEGORY_VARIANTS[rawTag.category]) {
            return CATEGORY_VARIANTS[rawTag.category];
        }

        // Fallback: try to infer from legacy fields
        const source = String(
            rawTag?.variant
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
                    isVanilla: false,
                };
            }

            const label = tag?.name || tag?.slug;
            if (!label) return null;

            return {
                key: tag?.id || tag?.slug || `${label}-${index}`,
                id: tag?.id,
                label,
                variant: resolveVariant(tag),
                isVanilla: tag?.isVanilla || tag?.is_vanilla || false,
            };
        })
        .filter(Boolean);

    if (normalizedTags.length === 0) {
        return <div className="tag-chips-empty">No tags</div>;
    }

    return (
        <div className="tag-chips">
            {normalizedTags.map((tag) => (
                <span
                    key={tag.key}
                    className={`tag-chip ${tag.isVanilla ? 'tag-chip--vanilla' : ''}`}
                    data-variant={tag.variant}
                >
                    {tag.isVanilla && <span className="tag-chip-vanilla-mark">Ⓥ </span>}
                    {tag.label}
                    {showRemoveButton && onRemove && (
                        <button
                            className="tag-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRemove(tag.id || tag.key);
                            }}
                            title="Remove tag"
                        >
                            &times;
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
}

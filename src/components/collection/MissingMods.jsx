import './collection.css';

/**
 * Mods the collection needs but does not contain.
 *
 * <p>`alternatives` is an any-one-of list: a base mod and a full translation of
 * it both provide the same content, so adding either one settles it.
 */
export default function MissingMods({
    missing = [],
    onAdd,
    addingId = null,
    errors = {},
    emptyLabel = 'Nothing is missing.',
}) {
    if (missing.length === 0) {
        return <p className="collection-note">{emptyLabel}</p>;
    }

    return (
        <ul className="missing-mods">
            {missing.map((entry, index) => {
                const title = entry.name || (entry.externalId ? `Mod #${entry.externalId}` : 'Unnamed package');
                const canAdd = Boolean(onAdd && entry.externalId);
                return (
                    <li key={entry.externalId ?? `${title}-${index}`} className="missing-mod">
                        <div className="missing-mod-head">
                            <span className="missing-mod-title">{title}</span>
                            <span className={`missing-mod-kind${entry.hard ? ' is-hard' : ''}`}>
                                {entry.hard ? 'Required' : 'Recommended'}
                            </span>
                        </div>
                        {entry.neededBy && (
                            <p className="missing-mod-reason">
                                {/* «Needed by» стояло и на рекомендациях: лодка не
                                    требует мод, она его использует, и отсутствие
                                    предмета ей ничем не грозит */}
                                {entry.hard ? 'Needed by' : 'Used by'} {entry.neededBy}
                                {/* Сколько именно взято. Без числа строка ровно
                                    одинакова для лодки, взявшей один стул, и для лодки,
                                    целиком построенной вокруг мода, а решение разное */}
                                {!entry.hard && entry.usedContent > 0 && (
                                    <> — {entry.usedContent} {entry.usedContent === 1 ? 'item' : 'items'} from it</>
                                )}
                            </p>
                        )}
                        {entry.alternatives.length > 0 && (
                            <p className="missing-mod-alternatives">
                                Any one of these does the job instead: {entry.alternatives.join(', ')}
                            </p>
                        )}
                        {canAdd && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => onAdd(entry)}
                                disabled={addingId === entry.externalId}
                            >
                                {addingId === entry.externalId ? 'Adding…' : 'Add to collection'}
                            </button>
                        )}
                        {!canAdd && !entry.externalId && (
                            <p className="missing-mod-note">
                                Not published on the Workshop, so it cannot be added from here.
                            </p>
                        )}
                        {errors[entry.externalId] && (
                            <p className="collection-note is-error">{errors[entry.externalId]}</p>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

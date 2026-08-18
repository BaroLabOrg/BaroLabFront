import { Link } from 'react-router-dom';
import './collection.css';

/**
 * The resolved load order, first entry first.
 *
 * <p>The caption is part of the component on purpose: the game gives the
 * earliest package in the list the last word, so a patch belongs above what it
 * patches. A list rendered without that sentence invites the reader to assume
 * the opposite.
 */
export default function OrderedModList({ entries = [], emptyLabel = 'Add mods to see their order.' }) {
    if (entries.length === 0) {
        return <p className="collection-note">{emptyLabel}</p>;
    }

    return (
        <>
            <p className="ordered-mods-hint">
                Top of the list loads first and wins every override it takes part in — a patch sits
                above the mod it patches. Write it into the game in exactly this order.
            </p>
            <ol className="ordered-mods">
                {entries.map((entry, index) => {
                    const unplaced = entry.placed === false;
                    const title = entry.name || (entry.externalId ? `Mod #${entry.externalId}` : 'Unnamed package');
                    return (
                        <li
                            key={entry.externalId ?? `${title}-${index}`}
                            className={`ordered-mod${unplaced ? ' is-unplaced' : ''}`}
                        >
                            <span className="ordered-mod-position">{entry.position || index + 1}</span>
                            <span className="ordered-mod-body">
                                <span className="ordered-mod-title">
                                    {entry.externalId ? (
                                        <Link to={`/mod/${entry.externalId}`}>{title}</Link>
                                    ) : title}
                                </span>
                                {entry.reason && (
                                    <span className="ordered-mod-reason">{entry.reason}</span>
                                )}
                                {unplaced && (
                                    <span className="ordered-mod-reason is-warning">
                                        Not in the graph yet — kept in the order you gave it, and nothing
                                        about it has been checked.
                                    </span>
                                )}
                            </span>
                            {entry.externalId ? (
                                <span className="ordered-mod-id">#{entry.externalId}</span>
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </>
    );
}

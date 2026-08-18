import { Link } from 'react-router-dom';
import './collection.css';

/**
 * The mods the author picked, in the author's own order.
 *
 * <p>That order is not the load order — it is what the resolver falls back on
 * wherever the graph has nothing to say about a pair.
 */
export default function SelectedMods({
    mods = [],
    unknownIds = [],
    onRemove,
    onMove,
    disabled = false,
}) {
    if (mods.length === 0) {
        return <p className="collection-note">No mods yet. Search on the left and add a few.</p>;
    }

    const unknown = new Set(unknownIds);

    return (
        <ul className="selected-mods">
            {mods.map((mod, index) => (
                <li key={mod.workshopId} className="selected-mod">
                    <span className="selected-mod-index">{index + 1}</span>
                    <span className="selected-mod-copy">
                        <Link to={`/mod/${mod.workshopId}`} className="selected-mod-title">
                            {mod.name || `Mod #${mod.workshopId}`}
                        </Link>
                        <span className="selected-mod-meta">
                            <span className="selected-mod-id">#{mod.workshopId}</span>
                            {unknown.has(mod.workshopId) && (
                                <span className="selected-mod-unknown" title="The graph has no data for this mod yet">
                                    not analysed
                                </span>
                            )}
                        </span>
                    </span>
                    <span className="selected-mod-actions">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label={`Move ${mod.name || mod.workshopId} up`}
                            onClick={() => onMove(mod.workshopId, -1)}
                            disabled={disabled || index === 0}
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label={`Move ${mod.name || mod.workshopId} down`}
                            onClick={() => onMove(mod.workshopId, 1)}
                            disabled={disabled || index === mods.length - 1}
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm selected-mod-remove"
                            aria-label={`Remove ${mod.name || mod.workshopId}`}
                            onClick={() => onRemove(mod.workshopId)}
                            disabled={disabled}
                        >
                            ✕
                        </button>
                    </span>
                </li>
            ))}
        </ul>
    );
}

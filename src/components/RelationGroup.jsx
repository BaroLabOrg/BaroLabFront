import { useState } from 'react';
import EncyclopediaEntityLink from './EncyclopediaEntityLink';

// Common materials are used by hundreds of recipes -- fpgacircuit alone is
// referenced by 192 items -- so a group starts capped and opens on demand.
const COLLAPSED_LIMIT = 24;

export default function RelationGroup({ group }) {
    const [expanded, setExpanded] = useState(false);
    const entries = group.entries;
    const isCapped = entries.length > COLLAPSED_LIMIT;
    const visible = isCapped && !expanded ? entries.slice(0, COLLAPSED_LIMIT) : entries;

    return (
        <div className="encyclopedia-relation-group">
            <h3 className="encyclopedia-relation-label">
                {group.label}
                <span className="encyclopedia-relation-count">{entries.length}</span>
            </h3>
            <ul className="encyclopedia-relation-list">
                {visible.map((relation) => (
                    <li key={`${group.key}-${relation.slug}`}>
                        <EncyclopediaEntityLink relation={relation} />
                    </li>
                ))}
            </ul>
            {isCapped && (
                <button
                    type="button"
                    className="encyclopedia-relation-more"
                    onClick={() => setExpanded((previous) => !previous)}
                >
                    {expanded ? 'Show fewer' : `Show all ${entries.length}`}
                </button>
            )}
        </div>
    );
}

import { useState } from 'react';
import { humanizeIdentifier } from '../utils/text';
import './EventActionTree.css';

// Depth at which branches start collapsed. Event scripts nest up to ~13
// levels, which is unreadable expanded but useless collapsed at the root.
const AUTO_COLLAPSE_DEPTH = 2;

function EventActionNode({ node, depth }) {
    const children = Array.isArray(node?.children) ? node.children : [];
    const attrs = node?.attrs && typeof node.attrs === 'object' ? node.attrs : {};
    const attrEntries = Object.entries(attrs);
    const [expanded, setExpanded] = useState(depth < AUTO_COLLAPSE_DEPTH);

    const tag = String(node?.tag || 'node');
    const hasChildren = children.length > 0;

    return (
        <li className="event-action-node">
            <div className="event-action-head">
                {hasChildren ? (
                    <button
                        type="button"
                        className="event-action-toggle"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${humanizeIdentifier(tag)}`}
                        onClick={() => setExpanded((prev) => !prev)}
                    >
                        <span
                            className={`event-action-chevron${expanded ? ' is-expanded' : ''}`}
                            aria-hidden="true"
                        />
                        <span className="event-action-tag">{humanizeIdentifier(tag)}</span>
                        <span className="event-action-count">{children.length}</span>
                    </button>
                ) : (
                    <span className="event-action-tag event-action-tag-leaf">{humanizeIdentifier(tag)}</span>
                )}

                {attrEntries.length > 0 && (
                    <span className="event-action-attrs">
                        {attrEntries.map(([key, value]) => (
                            <span className="event-action-attr" key={key}>
                                <span className="event-action-attr-key">{key}</span>
                                <span className="event-action-attr-value">{String(value)}</span>
                            </span>
                        ))}
                    </span>
                )}
            </div>

            {hasChildren && expanded && (
                <ul className="event-action-children">
                    {children.map((child, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <EventActionNode key={index} node={child} depth={depth + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

// Renders a random event's `actions` property -- a raw XML node tree
// ({tag, attrs, children}) -- as a collapsible outline. The generic property
// renderer turns it into nested "Tag / Attrs / Children" rows, which buries
// the thing that actually reads like a script: the tag names.
export default function EventActionTree({ nodes }) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        return null;
    }
    return (
        <ul className="event-action-tree">
            {nodes.map((node, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <EventActionNode key={index} node={node} depth={0} />
            ))}
        </ul>
    );
}

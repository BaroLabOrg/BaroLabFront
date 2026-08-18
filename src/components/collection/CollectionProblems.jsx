import {
    COLLECTION_PROBLEM_HINTS,
    COLLECTION_PROBLEM_LABELS,
    COLLECTION_SEVERITIES,
    COLLECTION_SEVERITY_LABELS,
} from '../../api/modCollections';
import './collection.css';

function label(problem) {
    return COLLECTION_PROBLEM_LABELS[problem.type] || problem.type || 'Problem';
}

function groupBySeverity(problems) {
    const known = new Set(COLLECTION_SEVERITIES);
    const groups = COLLECTION_SEVERITIES
        .map((severity) => ({
            severity,
            heading: COLLECTION_SEVERITY_LABELS[severity] || severity,
            items: problems.filter((problem) => problem.severity === severity),
        }))
        .filter((group) => group.items.length > 0);

    // A severity the backend adds later still has to reach the reader.
    const rest = problems.filter((problem) => !known.has(problem.severity));
    if (rest.length > 0) {
        groups.push({ severity: 'OTHER', heading: 'Other', items: rest });
    }
    return groups;
}

export default function CollectionProblems({ problems = [], emptyLabel = 'Nothing to report.' }) {
    if (problems.length === 0) {
        return <p className="collection-note">{emptyLabel}</p>;
    }

    return (
        <div className="collection-problems">
            {groupBySeverity(problems).map((group) => (
                <section key={group.severity} className={`problem-group severity-${group.severity.toLowerCase()}`}>
                    <h3 className="problem-group-heading">
                        {group.heading}
                        <span className="problem-group-count">{group.items.length}</span>
                    </h3>
                    <ul className="problem-list">
                        {group.items.map((problem, index) => (
                            <li key={`${problem.type}-${index}`} className="problem">
                                <span className="problem-type">{label(problem)}</span>
                                <p className="problem-summary">{problem.summary}</p>
                                {COLLECTION_PROBLEM_HINTS[problem.type] && (
                                    <p className="problem-hint">{COLLECTION_PROBLEM_HINTS[problem.type]}</p>
                                )}
                                {problem.packages.length > 0 && (
                                    <ul className="problem-packages">
                                        {problem.packages.map((name) => (
                                            <li key={name}>{name}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

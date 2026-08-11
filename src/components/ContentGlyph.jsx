const PATHS = {
    collection: (
        <>
            <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </>
    ),
    guide: (
        <>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4V5.5Z" />
            <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h3V5.5Z" />
        </>
    ),
    document: (
        <>
            <path d="M6 3h8l4 4v14H6V3Z" />
            <path d="M14 3v5h4M9 12h6M9 16h6" />
        </>
    ),
    weapon: (
        <>
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
    ),
    comment: (
        <>
            <path d="M5 18.5 3.5 21l4.2-1.1A9 9 0 1 0 5 18.5Z" />
            <path d="M8 12h8M8 15h5" />
        </>
    ),
    person: (
        <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5.5 20c.6-4.2 2.8-6.3 6.5-6.3s5.9 2.1 6.5 6.3" />
        </>
    ),
};

export default function ContentGlyph({ name, className = '', size = 22 }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {PATHS[name]}
        </svg>
    );
}

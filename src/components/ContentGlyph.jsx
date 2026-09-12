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
    star: (
        <path
            fill="currentColor"
            stroke="none"
            d="m12 3.3 2.62 5.5 6 .77-4.36 4.19 1.13 5.94L12 16.8l-5.39 2.9 1.13-5.94-4.36-4.19 6-.77L12 3.3Z"
        />
    ),
    download: (
        <>
            <path d="M12 3.5v11" />
            <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
            <path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
        </>
    ),
    price: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M9.3 14.3c.3 1 1.3 1.7 2.7 1.7 1.7 0 2.8-.8 2.8-2s-1-1.6-2.8-2c-1.8-.4-2.8-.8-2.8-2s1.1-2 2.8-2c1.4 0 2.4.7 2.7 1.7" />
            <path d="M12 6.7v1.1M12 16.2v1.1" />
        </>
    ),
    crew: (
        <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.5-3.5 2.4-5.2 5.5-5.2s5 1.7 5.5 5.2" />
            <circle cx="17" cy="9.2" r="2.3" />
            <path d="M15.2 13.3c2.4.3 3.7 1.8 4.1 4.3" />
        </>
    ),
    cargo: (
        <>
            <path d="M4 7h16v13H4V7Z" />
            <path d="m4 7 2.5-3.5h11L20 7M12 7v13M4 12.5h16" />
        </>
    ),
    thrust: (
        <>
            <path d="M4 16a8 8 0 0 1 16 0" />
            <path d="M12 16 16 10" />
            <path d="M4 16h1.2M18.8 16H20M12 6.3v1.2" />
        </>
    ),
    build: (
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z" />
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

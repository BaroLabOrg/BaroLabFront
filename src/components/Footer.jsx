import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import BaroLabIcon from './BaroLabIcon';
import './Footer.css';
import footerQuestStyles from './quest/FooterQuest.module.css';

const INFO_BOXES = {
    'Upload Guidelines': {
        title: 'Upload Guidelines',
        content: `All content uploaded to BaroLab must comply with the following rules:

• Mods must be original work or properly credited.
• No malicious code, exploits, or cheats that harm other players.
• Descriptions must be in English or include an English translation.
• NSFW content is strictly prohibited.
• Respect intellectual property — do not reupload others' work without permission.

Violations will result in content removal and possible account suspension.`,
    },
    'Content Protocols': {
        title: 'Content Protocols',
        content: `BaroLab follows strict content moderation protocols:

• All submissions are reviewed within 48 hours.
• Reported content is reviewed within 24 hours.
• Repeated violations result in permanent bans.
• Appeals can be submitted via the Contact Admin form.
• Admins reserve the right to remove any content at their discretion.`,
    },
    'Terms of Service': {
        title: 'Terms of Service',
        content: `By using BaroLab you agree to:

• Use the platform only for lawful purposes.
• Not attempt to reverse-engineer or exploit the platform.
• Accept that your content may be moderated or removed.
• Not impersonate other users or staff.
• Understand that accounts may be suspended for violations.

BaroLab reserves the right to update these terms at any time.`,
    },
    'Privacy Policy': {
        title: 'Privacy Policy',
        content: `BaroLab collects minimal data:

• Account information (username, email) for authentication.
• Usage data for improving the platform (anonymized).
• No data is sold to third parties.
• You may request deletion of your account and data at any time.
• Cookies are used only for session management.`,
    },
    'DMCA / Report Abuse': {
        title: 'DMCA / Report Abuse',
        content: `To file a DMCA takedown or report abuse:

• Contact us via the Official Email with subject "DMCA" or "Abuse Report".
• Include the URL of the infringing content.
• Provide proof of ownership or describe the violation.
• We will respond within 72 hours.

False DMCA claims may result in account termination.`,
    },
    'Contact Admin': {
        title: 'Contact Admin',
        content: `Contact options are coming soon.

• Direct contact will be available in a future update.
• For urgent matters, reach out via Discord: joperusik

Thank you for your patience.`,
    },
    'Official Email': {
        title: 'Official Email',
        content: `Official contact email is coming soon.

• This feature is currently in development.
• For now, reach out via Discord: joperusik

Thank you for your patience.`,
    },
    'Discord': {
        title: 'Discord Contacts',
        content: `BaroLab Discord contacts:

• Personal contact: joperusik (one of the developers)

• BaroLab Server [WIP]
  Official server coming soon.

Feel free to reach out for questions, bug reports, or just to chat about Barotrauma modding.`,
    },
    'Support': {
        title: 'Support the Station [WIP]',
        content: `Support options are coming soon.

This section is currently under development.
Check back later for ways to support the project.`,
    },
};

export default function Footer({ totalMods }) {
    const [activeBox, setActiveBox] = useState(null);
    const { stage, setStage, openInspect } = useQuest();

    // Stage 3 version glitch state
    const [versionGlitching, setVersionGlitching] = useState(false);
    const glitchTimerRef = useRef(null);

    useEffect(() => {
        if (stage !== 2) return;

        const scheduleGlitch = () => {
            // Random interval 15–20 seconds
            const delay = 15000 + Math.random() * 5000;
            glitchTimerRef.current = setTimeout(() => {
                setVersionGlitching(true);
                // Glitch lasts 1.5s (matches CSS animation), then reset and reschedule
                setTimeout(() => {
                    setVersionGlitching(false);
                    scheduleGlitch();
                }, 1600);
            }, delay);
        };

        scheduleGlitch();

        return () => {
            if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
        };
    }, [stage]);

    const handleVersionClick = () => {
        if (stage === 2) {
            if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
            setVersionGlitching(false);
            setStage(3);
            openInspect(3);
        }
    };

    const openBox = (key) => setActiveBox(key);
    const closeBox = () => setActiveBox(null);

    const info = activeBox ? INFO_BOXES[activeBox] : null;

    return (
        <footer className="site-footer">
            {info && (
                <div className="footer-infobox-overlay" onClick={closeBox}>
                    <div className="footer-infobox" onClick={(e) => e.stopPropagation()}>
                        <div className="footer-infobox-header">
                            <span className="footer-infobox-title">{info.title}</span>
                            <button className="footer-infobox-close" onClick={closeBox}>✕</button>
                        </div>
                        <pre className="footer-infobox-content">{info.content}</pre>
                    </div>
                </div>
            )}

            <div className="footer-main container">
                <div className="footer-col">
                    <h4 className="footer-col-title">Station Directory</h4>
                    <button className="footer-link" onClick={() => openBox('Upload Guidelines')}>
                        › Upload Guidelines
                    </button>
                    <button className="footer-link" onClick={() => openBox('Content Protocols')}>
                        › Content Protocols
                    </button>
                    <button className="footer-link footer-support" onClick={() => openBox('Support')}>
                        › Support the Station
                    </button>
                </div>

                <div className="footer-col">
                    <h4 className="footer-col-title">Legal &amp; Compliance</h4>
                    <Link className="footer-link" to="/about">
                        › About BaroLab
                    </Link>
                    <button className="footer-link" onClick={() => openBox('Terms of Service')}>
                        › Terms of Service
                    </button>
                    <button className="footer-link" onClick={() => openBox('Privacy Policy')}>
                        › Privacy Policy
                    </button>
                    <button className="footer-link" onClick={() => openBox('DMCA / Report Abuse')}>
                        › DMCA / Report Abuse
                    </button>
                </div>

                <div className="footer-col">
                    <h4 className="footer-col-title">External Comms</h4>
                    <button className="footer-link footer-link-ext" onClick={() => openBox('Discord')}>
                        <span className="footer-ext-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M19.3 5.3A17.6 17.6 0 0 0 15 4l-.2.4a16.4 16.4 0 0 1 3.8 1.2 15.2 15.2 0 0 0-13.2 0A16.4 16.4 0 0 1 9.2 4.4L9 4a17.6 17.6 0 0 0-4.3 1.3A18.4 18.4 0 0 0 1.5 17.9a17.7 17.7 0 0 0 5.4 2.7l1-1.7a11.5 11.5 0 0 1-1.8-.9l.4-.3a13 13 0 0 0 11 0l.4.3a11.5 11.5 0 0 1-1.8.9l1 1.7a17.7 17.7 0 0 0 5.4-2.7A18.4 18.4 0 0 0 19.3 5.3ZM8.6 15c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 2 1 1.9 2.2S9.6 15 8.6 15Zm6.8 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 2 1 1.9 2.2-.8 2.2-1.9 2.2Z" />
                            </svg>
                        </span>
                        Discord
                    </button>
                    <a
                        className="footer-link footer-link-ext"
                        href="https://github.com/BaroLabOrg"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="footer-ext-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M12 1a11 11 0 0 0-3.5 21.4c.6.1.8-.2.8-.5v-2c-3 .7-3.7-1.4-3.7-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7 0-.7 0-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9 0-.7.4-1.2.7-1.5-2.4-.3-5-1.2-5-5.4 0-1.2.5-2.2 1.1-3 0-.3-.4-1.4.1-2.9 0 0 1-.3 3 1.1a10.6 10.6 0 0 1 5.4 0c2-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.6 5.1-5 5.4.4.3.8 1 .8 2v3c0 .3.2.6.8.5A11 11 0 0 0 12 1Z" />
                            </svg>
                        </span>
                        GitHub
                    </a>
                    <button className="footer-link footer-link-ext footer-wip" onClick={() => openBox('Contact Admin')}>
                        › Contact Admin
                    </button>
                    <button className="footer-link footer-link-ext footer-wip" onClick={() => openBox('Official Email')}>
                        <span className="footer-ext-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" focusable="false">
                                <rect x="3" y="5" width="18" height="14" rx="1" />
                                <path d="m3.5 7 8.5 6 8.5-6" />
                            </svg>
                        </span>
                        Official Email
                    </button>
                </div>
            </div>

            <div className="footer-manifest container">
                <div className="footer-manifest-left">
                    <span className="footer-manifest-title">Station Manifest</span>
                    <span className="footer-manifest-line">
                        BaroLab is an unofficial fan-made project and is not affiliated with or endorsed by
                        FakeFish, Undertow Games or Daedalic Entertainment.
                    </span>
                    <span className="footer-manifest-line">back: [crew]</span>
                    <span className="footer-manifest-line">back: [crew]</span>
                    <span className="footer-manifest-line">front: [crew]</span>
                    <span className="footer-manifest-line">front: [crew]</span>
                </div>
                <div className="footer-manifest-right">
                    <span
                        className={`footer-manifest-stat${stage === 2 ? ` ${footerQuestStyles.versionClickable}` : ''}${versionGlitching ? ` ${footerQuestStyles.versionGlitching}` : ''}`}
                        onClick={handleVersionClick}
                        role={stage === 2 ? 'button' : undefined}
                        tabIndex={stage === 2 ? 0 : undefined}
                        onKeyDown={event => {
                            if (stage === 2 && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                handleVersionClick();
                            }
                        }}
                        title={stage === 2 ? 'Administrator access: open archive record' : undefined}
                        aria-label={stage === 2 ? 'Open archive record' : 'Build version'}
                    >
                        BUILD: {versionGlitching ? 'v5.1.2' : 'v1.0.4'}
                    </span>
                    <span className="footer-manifest-stat">ACTIVE CREW: 142</span>
                    <span className="footer-manifest-stat">
                        JOVIAN RADS: NOMINAL <span className="footer-rads-dot" />
                    </span>
                    <span className="footer-manifest-stat">
                        ARCHIVES: {totalMods != null ? totalMods.toLocaleString('en-US') : '—'}
                    </span>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-bottom-inner container">
                    <span className="footer-logo"><BaroLabIcon className="footer-logo-icon" width={14} height={19} /> BAROLAB</span>
                    <div className="footer-ticker-wrap">
                        <span className="footer-ticker">
                            BUILD: v1.0.4 &nbsp;·&nbsp; ACTIVE CREW: 142 &nbsp;·&nbsp; JOVIAN RADS: NOMINAL &nbsp;·&nbsp;
                            ARCHIVES: {totalMods != null ? totalMods.toLocaleString('en-US') : '—'} &nbsp;·&nbsp;
                            BUILD: v1.0.4 &nbsp;·&nbsp; ACTIVE CREW: 142 &nbsp;·&nbsp; JOVIAN RADS: NOMINAL &nbsp;·&nbsp;
                            ARCHIVES: {totalMods != null ? totalMods.toLocaleString('en-US') : '—'} &nbsp;·&nbsp;
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

import { useState } from 'react';
import './Footer.css';

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
        content: `Need to reach the BaroLab administration?

• For urgent issues: use the Official Email.
• For ban appeals: include your username and reason.
• For bug reports: describe the issue with steps to reproduce.
• Response time: 1–3 business days.

Please be respectful — our admins are volunteers.`,
    },
    'Official Email': {
        title: 'Official Email',
        content: `Official contact email:

admin@barolab.i-lab.ink

Use this address for:
• DMCA takedown requests
• Account issues
• Partnership inquiries
• Security vulnerability reports`,
    },
};

export default function Footer({ totalMods }) {
    const [activeBox, setActiveBox] = useState(null);

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
                    <button className="footer-link footer-support">
                        › Support the Station 10 відсотків на зсу 🇺🇦
                    </button>
                </div>

                <div className="footer-col">
                    <h4 className="footer-col-title">Legal &amp; Compliance</h4>
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
                    <a
                        className="footer-link footer-link-ext"
                        href="https://discord.gg/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="footer-ext-icon">💬</span> Discord
                    </a>
                    <a
                        className="footer-link footer-link-ext"
                        href="https://github.com/Joperusik/BaroLab"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="footer-ext-icon">🐙</span> GitHub
                    </a>
                    <button className="footer-link footer-link-ext" onClick={() => openBox('Contact Admin')}>
                        › Contact Admin
                    </button>
                    <button className="footer-link footer-link-ext" onClick={() => openBox('Official Email')}>
                        <span className="footer-ext-icon">✉</span> Official Email
                    </button>
                </div>
            </div>

            <div className="footer-manifest container">
                <div className="footer-manifest-left">
                    <span className="footer-manifest-title">Station Manifest</span>
                    <span className="footer-manifest-line">back: @сігма буданов</span>
                    <span className="footer-manifest-line">back: @сігма буданов</span>
                    <span className="footer-manifest-line">back: @сігма буданов</span>
                    <span className="footer-manifest-line">back: @сігма буданов</span>
                </div>
                <div className="footer-manifest-right">
                    <span className="footer-manifest-stat">BUILD: v1.0.4</span>
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
                    <span className="footer-logo">◉ BAROLAB</span>
                    <span className="footer-ticker">
                        BUILD: v1.0.4 &nbsp;|&nbsp; ACTIVE CREW: 142 &nbsp;|&nbsp; JOVIAN RADS: NOMINAL &nbsp;|&nbsp;
                        ARCHIVES: {totalMods != null ? totalMods.toLocaleString('en-US') : '—'} &nbsp;|&nbsp;
                        BUILD: v1.0.4 &nbsp;|&nbsp; ACTIVE CREW: 142 &nbsp;|&nbsp; JOVIAN RADS: NOMINAL &nbsp;|&nbsp;
                        ARCHIVES: {totalMods != null ? totalMods.toLocaleString('en-US') : '—'}
                    </span>
                </div>
            </div>
        </footer>
    );
}

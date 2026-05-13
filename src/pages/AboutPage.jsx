import Footer from '../components/Footer';
import './AboutPage.css';

export default function AboutPage() {
    return (
        <div className="about-page">
            <main className="about-main container">
                <div className="about-terminal glass-card">
                    <div className="about-terminal-topbar">
                        <span className="about-terminal-prompt">&gt; root@barolab:~# cat about.txt</span>
                        <span className="about-terminal-dots">— □ ✕</span>
                    </div>

                    <div className="about-terminal-body">
                        <section className="about-section">
                            <h1 className="about-title">About BaroLab</h1>
                            <p className="about-text">
                                BaroLab is an independent community-built platform for Barotrauma players, modders and submarine creators.
                            </p>
                        </section>

                        <section className="about-section">
                            <h2 className="about-subtitle">What BaroLab contains</h2>
                            <p className="about-text">
                                BaroLab helps users discover Barotrauma mods, custom submarines, community guides, tags, load order information, vanilla game data and encyclopedia entries.
                            </p>
                            <ul className="about-list">
                                <li><span className="about-list-label">Mods</span> — Barotrauma Workshop modifications with descriptions, tags, ratings and download info.</li>
                                <li><span className="about-list-label">Submarines</span> — Custom-built vessels with technical characteristics, crew requirements and class data.</li>
                                <li><span className="about-list-label">Guides</span> — Community-written guides covering engineering, wiring, medical procedures and modding.</li>
                                <li><span className="about-list-label">Tags</span> — Categorization system for mods and submarines.</li>
                                <li><span className="about-list-label">Load Order</span> — Tools for managing Barotrauma mod load order and resolving conflicts.</li>
                                <li><span className="about-list-label">Vanilla Data</span> — Reference data from the base Barotrauma game.</li>
                                <li><span className="about-list-label">Encyclopedia</span> — Entries for Barotrauma creatures, items and game mechanics.</li>
                            </ul>
                        </section>

                        <section className="about-section">
                            <h2 className="about-subtitle">Project status</h2>
                            <p className="about-text">
                                BaroLab is currently in public beta. Some features may be incomplete or subject to change.
                            </p>
                        </section>

                        <section className="about-section">
                            <h2 className="about-subtitle">Disclaimer</h2>
                            <p className="about-text about-text--disclaimer">
                                BaroLab is not affiliated with FakeFish, Undertow Games, Daedalic Entertainment, Steam or Valve.
                                All Barotrauma trademarks and assets belong to their respective owners.
                            </p>
                        </section>

                        <section className="about-section">
                            <h2 className="about-subtitle">Links</h2>
                            <ul className="about-links">
                                <li>
                                    <a
                                        href="https://github.com/BaroLabOrg"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="about-link"
                                    >
                                        🐙 GitHub — BaroLabOrg
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

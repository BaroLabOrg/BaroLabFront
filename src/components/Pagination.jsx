import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import QuestOnboarding from './quest/QuestOnboarding';
import glitchStyles from './quest/GlitchPagination.module.css';
import './Pagination.css';

const MAX_VISIBLE_PAGES = 5;

function getPageItems(currentPage, totalPages) {
    if (totalPages <= MAX_VISIBLE_PAGES) {
        return Array.from({ length: totalPages }, (_, index) => index);
    }

    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
        start = Math.max(0, end - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function Pagination({
    page = 0,
    totalPages = 0,
    hasNext = false,
    hasPrevious = false,
    disabled = false,
    onPageChange,
}) {
    const location = useLocation();
    const { stage, setStage, openInspect } = useQuest();
    const [onboardingOpen, setOnboardingOpen] = useState(false);

    if (totalPages <= 1) return null;

    const pageItems = getPageItems(page, totalPages);
    const canGoPrevious = !disabled && hasPrevious;
    const canGoNext = !disabled && hasNext;

    // Quest Stage 1: on /mods, page 0, stage 0 — glitch the disabled Back button
    const isModsPage = location.pathname === '/mods';
    const showQuestGlitch = isModsPage && stage === 0 && !canGoPrevious;

    const handleBackClick = (e) => {
        if (showQuestGlitch) {
            e.preventDefault();
            setOnboardingOpen(true);
            return;
        }
        if (canGoPrevious) {
            onPageChange(page - 1);
        }
    };

    const handleOnboardingConfirm = () => {
        setOnboardingOpen(false);
        setStage(1);
        openInspect(1);
    };

    const handleOnboardingCancel = () => {
        setOnboardingOpen(false);
    };

    return (
        <>
            <nav className="pagination glass-card" aria-label="Pagination">
                <button
                    type="button"
                    className={`pagination-nav${showQuestGlitch ? ` ${glitchStyles.backGlitch}` : ''}`}
                    disabled={!canGoPrevious && !showQuestGlitch}
                    onClick={handleBackClick}
                    aria-label={showQuestGlitch ? 'Back (anomaly detected)' : 'Back'}
                >
                    Back
                </button>

                <div className="pagination-pages">
                    {pageItems.map((pageIndex) => (
                        <button
                            key={pageIndex}
                            type="button"
                            className={`pagination-page ${pageIndex === page ? 'active' : ''}`}
                            disabled={disabled || pageIndex === page}
                            onClick={() => onPageChange(pageIndex)}
                        >
                            {pageIndex + 1}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="pagination-nav"
                    disabled={!canGoNext}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </nav>

            <QuestOnboarding
                open={onboardingOpen}
                onConfirm={handleOnboardingConfirm}
                onCancel={handleOnboardingCancel}
            />
        </>
    );
}

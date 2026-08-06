import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useOptionalQuest } from '../context/QuestContext';
import QuestOnboarding from './quest/QuestOnboarding';
import glitchStyles from './quest/GlitchPagination.module.css';
import './Pagination.css';

const ELLIPSIS = 'ellipsis';
const PAGE_WINDOW_SIZE = 7;
const PAGE_WINDOW_RADIUS = Math.floor(PAGE_WINDOW_SIZE / 2);
const MAX_PAGES_WITHOUT_ELLIPSIS = PAGE_WINDOW_SIZE + 2;

function getPageItems(currentPage, totalPages) {
    if (totalPages <= MAX_PAGES_WITHOUT_ELLIPSIS) {
        return Array.from({ length: totalPages }, (_, index) => index);
    }

    const lastPage = totalPages - 1;
    const windowStart = currentPage - PAGE_WINDOW_RADIUS;
    const windowEnd = currentPage + PAGE_WINDOW_RADIUS;

    if (windowStart <= 1) {
        return [
            ...Array.from({ length: PAGE_WINDOW_SIZE }, (_, index) => index),
            ELLIPSIS,
            lastPage,
        ];
    }

    if (windowEnd >= lastPage - 1) {
        return [
            0,
            ELLIPSIS,
            ...Array.from(
                { length: PAGE_WINDOW_SIZE },
                (_, index) => lastPage - PAGE_WINDOW_SIZE + 1 + index,
            ),
        ];
    }

    return [
        0,
        ELLIPSIS,
        ...Array.from(
            { length: PAGE_WINDOW_SIZE },
            (_, index) => windowStart + index,
        ),
        ELLIPSIS,
        lastPage,
    ];
}

function normalizeTotalPages(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function clampPage(value, totalPages) {
    const parsed = Number(value);
    const normalized = Number.isInteger(parsed) ? parsed : 0;
    return Math.min(Math.max(normalized, 0), Math.max(totalPages - 1, 0));
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
    const quest = useOptionalQuest();
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const normalizedTotalPages = normalizeTotalPages(totalPages);
    const currentPage = clampPage(page, normalizedTotalPages);
    const canChangePage = typeof onPageChange === 'function';

    useEffect(() => {
        if (
            !disabled
            && canChangePage
            && normalizedTotalPages > 0
            && Number(page) !== currentPage
        ) {
            onPageChange(currentPage);
        }
    }, [canChangePage, currentPage, disabled, normalizedTotalPages, onPageChange, page]);

    if (normalizedTotalPages <= 1) return null;

    const pageItems = getPageItems(currentPage, normalizedTotalPages);
    const canGoPrevious = !disabled && canChangePage && (hasPrevious || currentPage > 0);
    const canGoNext = !disabled
        && canChangePage
        && (hasNext || currentPage + 1 < normalizedTotalPages);

    // Quest Stage 1: on /mods, page 0, stage 0 — glitch the disabled Back button.
    const isModsPage = location.pathname === '/mods'
        && new URLSearchParams(location.search).get('guideTarget') !== '1';
    const showQuestGlitch = isModsPage && quest?.stage === 0 && currentPage === 0 && !canGoPrevious;

    const changePage = (targetPage) => {
        if (disabled || !canChangePage) return;
        const nextPage = clampPage(targetPage, normalizedTotalPages);
        if (nextPage !== currentPage) {
            onPageChange(nextPage);
        }
    };

    const handleBackClick = (event) => {
        if (showQuestGlitch) {
            event.preventDefault();
            setOnboardingOpen(true);
            return;
        }
        if (canGoPrevious) {
            changePage(currentPage - 1);
        }
    };

    const handleOnboardingConfirm = () => {
        setOnboardingOpen(false);
        quest?.setStage(1);
        quest?.openInspect(1);
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
                    {pageItems.map((pageItem, index) => (
                        pageItem === ELLIPSIS ? (
                            <span
                                key={`${ELLIPSIS}-${index}`}
                                className="pagination-ellipsis"
                                aria-hidden="true"
                            >
                                &hellip;
                            </span>
                        ) : (
                            <button
                                key={pageItem}
                                type="button"
                                className={`pagination-page ${pageItem === currentPage ? 'active' : ''}`}
                                disabled={disabled || !canChangePage || pageItem === currentPage}
                                onClick={() => changePage(pageItem)}
                                aria-label={`Page ${pageItem + 1}`}
                                aria-current={pageItem === currentPage ? 'page' : undefined}
                            >
                                {pageItem + 1}
                            </button>
                        )
                    ))}
                </div>

                <button
                    type="button"
                    className="pagination-nav"
                    disabled={!canGoNext}
                    onClick={() => changePage(currentPage + 1)}
                    aria-label="Next"
                >
                    Next
                </button>
            </nav>

            <QuestOnboarding
                open={onboardingOpen}
                onConfirm={handleOnboardingConfirm}
                onCancel={() => setOnboardingOpen(false)}
            />
        </>
    );
}

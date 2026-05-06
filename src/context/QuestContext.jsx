import { createContext, useContext, useState, useCallback } from 'react';

const QUEST_KEY = 'signalis_quest_stage';

const QuestContext = createContext(null);

export function QuestProvider({ children }) {
    const [stage, setStageState] = useState(() => {
        const saved = localStorage.getItem(QUEST_KEY);
        const parsed = parseInt(saved, 10);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? parsed : 0;
    });

    // Which item is currently open in the inspection modal (1, 2, or 3), null = closed
    const [inspectingItem, setInspectingItem] = useState(null);

    // Is the final terminal open?
    const [terminalOpen, setTerminalOpen] = useState(false);

    const setStage = useCallback((newStage) => {
        localStorage.setItem(QUEST_KEY, String(newStage));
        setStageState(newStage);
    }, []);

    const resetQuest = useCallback(() => {
        localStorage.removeItem(QUEST_KEY);
        setStageState(0);
        setInspectingItem(null);
        setTerminalOpen(false);
    }, []);

    const openInspect = useCallback((itemNumber) => {
        setInspectingItem(itemNumber);
    }, []);

    const closeInspect = useCallback(() => {
        setInspectingItem(null);
    }, []);

    const openTerminal = useCallback(() => {
        setTerminalOpen(true);
    }, []);

    const closeTerminal = useCallback(() => {
        setTerminalOpen(false);
    }, []);

    return (
        <QuestContext.Provider value={{
            stage,
            setStage,
            resetQuest,
            inspectingItem,
            openInspect,
            closeInspect,
            terminalOpen,
            openTerminal,
            closeTerminal,
        }}>
            {children}
        </QuestContext.Provider>
    );
}

export function useQuest() {
    const ctx = useContext(QuestContext);
    if (!ctx) throw new Error('useQuest must be used inside QuestProvider');
    return ctx;
}

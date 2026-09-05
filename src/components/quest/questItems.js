// Opening broadcast from SIGNALIS; each five-digit group is spoken twice.
export const OPENING_TRANSMISSION = '39486 60170 24326 01064';

export const QUEST_ITEMS = {
    1: {
        name: 'RADIO RECEIVER', shortName: 'RADIO', designation: 'SATELLIT / ORBITAL', type: 'radio',
        description: `The transmission is coming from this receiver. Its casing is still warm.\n\n“ACHTUNG. ACHTUNG.”\n\nA voice reads four groups of numbers in German, repeating each group twice.\n\n${OPENING_TRANSMISSION}\n\nThen the sequence begins again.`,
        backDescription: 'A location is written on a service label attached to the rear panel.\n\nSEKTOR 404. A place the navigation system cannot find.\n\nSomeone has been following this signal before me.',
        clue: 'SEKTOR 404', hint: 'Follow the location on the label. Find the missing page: /404.', condition: 'SIGNAL RECEIVED / SOURCE UNKNOWN',
    },
    2: {
        name: 'ADMINISTRATOR’S PASS', shortName: 'PASS', designation: 'ADLR-S2301', type: 'card',
        description: 'The signal led me to this administration pass, buried among the missing records.\n\nAn unfamiliar face in the photograph. Why do I feel I have seen him before?\n\nThe magnetic stripe is still intact. It may open something that was sealed away.',
        backDescription: 'An archive reference is stamped below the magnetic stripe.\n\nThe record is hidden in the station manifest, beneath the main directory.\n\nThis pass should grant access.',
        clue: 'ARCHIV\nHOME / BUILD RECORD', hint: 'Return to the home page. Select BUILD in the station manifest at the bottom.', condition: 'ARCHIVE ACCESS / AUTHORIZED',
    },
    3: {
        name: 'THE KING IN YELLOW', shortName: 'BOOK', designation: 'THE KING IN YELLOW', type: 'book',
        description: 'A book recovered from the sealed archive. A figure in yellow robes stands on its black cover.\n\nThe paper smells of dust and something sweet. Some lines are underlined, but I do not remember reading them.\n\nI should not have opened this book.',
        backDescription: 'A protocol number and a frequency, written by hand on the back cover.\n\nThe handwriting seems familiar.\n\nThe receiver, the pass, the book. Everything has led me here.',
        clue: 'Protokoll: 512\nFrequenz: 240.0', hint: 'Select INV to open the terminal. Enter the protocol and frequency written here.\n\nREMEMBER OUR PROMISE', condition: 'ARCHIVE RECOVERED / MEMORY FRAGMENT',
    },
};

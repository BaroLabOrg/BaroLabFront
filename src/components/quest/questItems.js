export const QUEST_ITEMS = {
    1: {
        name: 'ADMINISTRATOR’S PASS', shortName: 'PASS', designation: 'ADLR-S2301', type: 'card',
        description: 'An administration pass for the Sierpinski facility.\n\nAn unfamiliar face in the photograph. Why do I feel I have seen him before?\n\nThe magnetic stripe is still intact.',
        backDescription: 'Someone has scratched a sector number below the magnetic stripe.\n\nThere is no such sector on the facility map.',
        clue: 'SEKTOR 404', hint: 'Look where the data is missing.', condition: 'MAGNETIC CARD / S-23',
    },
    2: {
        name: 'RADIO RECEIVER', shortName: 'RADIO', designation: 'SATELLIT / ORBITAL', type: 'radio',
        description: 'An old multiband receiver. Its heavy casing is still warm.\n\nA voice beneath the static repeats the same words.\n\n“The rule of six.”',
        backDescription: 'A service note remains on the rear panel.\n\nThe signal is coming from below. From the very foundation of the system.',
        clue: 'FOOTER / BUILD VERSION', hint: 'Check the build version at the bottom of the home page.', condition: 'SIGNAL RECEPTION / UNSTABLE',
    },
    3: {
        name: 'THE KING IN YELLOW', shortName: 'BOOK', designation: 'THE KING IN YELLOW', type: 'book',
        description: 'A book bound in black. A figure in yellow robes stands on the cover.\n\nThe paper smells of dust and something sweet. Some lines are underlined, but I do not remember reading them.\n\nI should not have opened this book.',
        backDescription: 'Two handwritten lines on the back cover.\n\nThe handwriting seems familiar.',
        clue: 'Protokoll: 512\nFrequenz: 240.0', hint: 'REMEMBER OUR PROMISE', condition: 'PRINTED VOLUME / AUTHOR UNKNOWN',
    },
};

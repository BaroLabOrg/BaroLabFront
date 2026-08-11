import { describe, expect, it } from 'vitest';
import { parseSteamBbcode, sanitizeSteamUrl, steamBbcodeToExcerpt, steamBbcodeToPlainText } from './steamBbcode';

describe('steamBbcode', () => {
    it('preserves structure while producing a clean text projection', () => {
        const source = '[h1]Updated[/h1]\r\n\r\nA [b]formatted[/b] description.\n[list][*]One[*]Two[/list]';

        expect(steamBbcodeToPlainText(source)).toBe('Updated\n\nA formatted description.\n• One\n• Two');
        expect(steamBbcodeToExcerpt(source, 25)).toBe('Updated A formatted…');
    });

    it('keeps noparse and code contents literal', () => {
        const nodes = parseSteamBbcode('[noparse][b]literal[/b][/noparse][code][x] = 1[/code]');

        expect(nodes[0].children[0].value).toBe('[b]literal[/b]');
        expect(nodes[1].children[0].value).toBe('[x] = 1');
    });

    it('allows only web URLs', () => {
        expect(sanitizeSteamUrl('https://steamcommunity.com/example')).toContain('https://steamcommunity.com/example');
        expect(sanitizeSteamUrl('javascript:alert(1)')).toBeNull();
        expect(sanitizeSteamUrl('data:text/html,test')).toBeNull();
    });
});

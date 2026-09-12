import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatureAnatomyViewer from './CreatureAnatomyViewer';

function anatomyRender(overrides = {}) {
    const image = (name) => ({ publicUrl: `https://cdn.test/${name}.png` });
    return {
        renderHash: 'render-1',
        poseKey: 'canonical_neutral',
        canvas: { width: 100, height: 50 },
        fallbackComposite: image('composite'),
        hitMap: image('hitmap'),
        warnings: ['Runtime deformation omitted.'],
        limbs: [
            {
                limbKey: 'torso', ragdollLimbId: 0, name: 'Torso', type: 'Torso', zIndex: 0,
                hitColor: '#112233', bounds: { x: 0, y: 0, width: 60, height: 50 }, image: image('torso'),
                healthIndex: 0, mappingStatus: 'EXACT_NAME', damageModifiers: [],
            },
            {
                limbKey: 'head', ragdollLimbId: 1, name: 'Head', type: 'Head', zIndex: 1,
                hitColor: '#AABBCC', bounds: { x: 60, y: 0, width: 40, height: 30 }, image: image('head'),
                healthIndex: 1, mappingStatus: 'HEALTH_INDEX',
                damageModifiers: [{ afflictionType: 'damage', afflictionIdentifier: 'blunttrauma', multiplier: 1.5 }],
            },
        ],
        ...overrides,
    };
}

describe('CreatureAnatomyViewer', () => {
    let pixel = [0xAA, 0xBB, 0xCC, 255];
    let hitMapRead;
    let throwSecurityError = false;

    beforeEach(() => {
        pixel = [0xAA, 0xBB, 0xCC, 255];
        throwSecurityError = false;
        hitMapRead = vi.fn(() => {
            if (throwSecurityError) throw new DOMException('Tainted canvas', 'SecurityError');
            return { data: new Uint8ClampedArray(pixel) };
        });
        vi.stubGlobal('requestAnimationFrame', (callback) => {
            callback();
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        vi.stubGlobal('PointerEvent', MouseEvent);
        vi.stubGlobal('ResizeObserver', class {
            constructor(callback) { this.callback = callback; }
            observe() { this.callback(); }
            disconnect() {}
        });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect() {
            const width = this.tagName === 'CANVAS' ? 400 : 600;
            const height = this.tagName === 'CANVAS' ? 200 : 360;
            return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height };
        });
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext() {
            return {
                setTransform: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
                getImageData: hitMapRead,
                globalAlpha: 1, filter: 'none',
            };
        });
        vi.stubGlobal('Image', class {
            set src(value) {
                this._src = value;
                queueMicrotask(() => value.includes('fail') ? this.onerror?.() : this.onload?.());
            }
            get src() { return this._src; }
        });
    });

    it('selects limbs from the hit-map and exposes the same interaction to keyboard users', async () => {
        const user = userEvent.setup();
        const { container } = render(<CreatureAnatomyViewer render={anatomyRender()} creatureName="Crawler" />);

        expect(await screen.findByText('2 limbs')).toBeInTheDocument();
        const displayCanvas = container.querySelector('.creature-anatomy-canvas');
        expect(displayCanvas).toHaveStyle({ width: '600px', height: '300px', left: '0px', top: '30px' });
        fireEvent.pointerMove(displayCanvas, { clientX: 300, clientY: 50, pointerType: 'mouse' });

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Head' })).toBeInTheDocument());
        expect(screen.getByText('blunttrauma')).toBeInTheDocument();
        expect(screen.getByText(/^×1[.,]5$/)).toBeInTheDocument();
        expect(screen.getByText('Head selected')).toBeInTheDocument();
        expect(hitMapRead).toHaveBeenCalledWith(75, 12, 1, 1);

        const torsoButton = screen.getByRole('button', { name: /Torso/ });
        await user.tab();
        while (document.activeElement !== torsoButton) await user.tab();
        await user.keyboard('{Enter}');
        expect(torsoButton).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Torso selected')).toBeInTheDocument();
        expect(screen.getByText('No limb-specific multiplier data.')).toBeInTheDocument();
        expect(screen.getByText('Render notes · 1')).toBeInTheDocument();
        expect(screen.getByText('Runtime deformation omitted.')).toBeInTheDocument();
    });

    it('uses pointer-up for touch selection without depending on hover', async () => {
        const { container } = render(<CreatureAnatomyViewer render={anatomyRender()} />);
        expect(await screen.findByText('2 limbs')).toBeInTheDocument();
        fireEvent.pointerUp(container.querySelector('.creature-anatomy-canvas'), {
            clientX: 300, clientY: 50, pointerType: 'touch',
        });
        expect(await screen.findByText('Head selected')).toBeInTheDocument();
    });

    it('keeps the static composite and limb list usable when a layer fails', async () => {
        const broken = anatomyRender({
            limbs: anatomyRender().limbs.map((limb) => (
                limb.limbKey === 'head' ? { ...limb, image: { publicUrl: 'https://cdn.test/fail.png' } } : limb
            )),
        });
        render(<CreatureAnatomyViewer render={broken} creatureName="Crawler" />);

        expect(await screen.findByText(/1 anatomy layer could not be loaded/)).toBeInTheDocument();
        expect(screen.getByAltText('Crawler anatomy composite')).toHaveAttribute('src', 'https://cdn.test/composite.png');
        expect(screen.getByRole('button', { name: /Head/ })).toBeEnabled();
        expect(screen.getByText('Fallback view')).toBeInTheDocument();
    });

    it('falls back when browser security prevents hit-map pixel reads', async () => {
        throwSecurityError = true;
        render(<CreatureAnatomyViewer render={anatomyRender()} />);

        expect(await screen.findByText(/hit-map is blocked by asset CORS settings/)).toBeInTheDocument();
        expect(screen.getByText('Fallback view')).toBeInTheDocument();
    });

    it('renders nothing when the detail has no usable limb bundle', () => {
        const { container } = render(<CreatureAnatomyViewer render={{ limbs: [] }} />);
        expect(container).toBeEmptyDOMElement();
    });
});

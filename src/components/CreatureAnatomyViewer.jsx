import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './CreatureAnatomyViewer.css';

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
    });
}

function colorKey(red, green, blue) {
    return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function fitContain(containerWidth, containerHeight, sourceWidth, sourceHeight) {
    if (!containerWidth || !containerHeight || !sourceWidth || !sourceHeight) {
        return { width: 0, height: 0, left: 0, top: 0 };
    }
    const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return {
        width,
        height,
        left: (containerWidth - width) / 2,
        top: (containerHeight - height) / 2,
    };
}

function multiplierLabel(value) {
    return Number.isFinite(value) ? `×${Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })}` : '—';
}

export default function CreatureAnatomyViewer({ render, creatureName = 'Creature' }) {
    const stageRef = useRef(null);
    const displayCanvasRef = useRef(null);
    const hitCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const imagesRef = useRef(new Map());
    const frameRef = useRef(null);
    const [fit, setFit] = useState({ width: 0, height: 0, left: 0, top: 0 });
    const [status, setStatus] = useState('loading');
    const [fallbackReason, setFallbackReason] = useState('');
    const [selectedKey, setSelectedKey] = useState(render?.limbs?.[0]?.limbKey || null);
    const [pointer, setPointer] = useState(null);

    const limbs = useMemo(
        () => [...(render?.limbs || [])].sort((left, right) => left.zIndex - right.zIndex || left.ragdollLimbId - right.ragdollLimbId),
        [render],
    );
    const limbByKey = useMemo(() => new Map(limbs.map((limb) => [limb.limbKey, limb])), [limbs]);
    const limbByColor = useMemo(() => new Map(limbs.map((limb) => [limb.hitColor.toUpperCase(), limb])), [limbs]);
    const selectedLimb = limbByKey.get(selectedKey) || limbs[0] || null;

    useEffect(() => {
        setSelectedKey(limbs[0]?.limbKey || null);
    }, [render?.renderHash, limbs]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !render?.canvas) return undefined;
        const update = () => {
            const rect = stage.getBoundingClientRect();
            setFit(fitContain(rect.width, rect.height, render.canvas.width, render.canvas.height));
        };
        update();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', update);
            return () => window.removeEventListener('resize', update);
        }
        const observer = new ResizeObserver(update);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [render?.canvas]);

    const drawDisplay = useCallback(() => {
        const canvas = displayCanvasRef.current;
        if (!canvas || !fit.width || !fit.height || fallbackReason) return;
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = Math.max(1, Math.round(fit.width * dpr));
        canvas.height = Math.max(1, Math.round(fit.height * dpr));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.setTransform(
            canvas.width / render.canvas.width,
            0,
            0,
            canvas.height / render.canvas.height,
            0,
            0,
        );
        context.clearRect(0, 0, render.canvas.width, render.canvas.height);
        limbs.forEach((limb) => {
            const image = imagesRef.current.get(limb.limbKey);
            if (image) {
                context.drawImage(image, limb.bounds.x, limb.bounds.y, limb.bounds.width, limb.bounds.height);
            }
        });
    }, [fallbackReason, fit.height, fit.width, limbs, render?.canvas]);

    const drawHighlight = useCallback(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas || !fit.width || !fit.height || fallbackReason) return;
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = Math.max(1, Math.round(fit.width * dpr));
        canvas.height = Math.max(1, Math.round(fit.height * dpr));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.setTransform(
            canvas.width / render.canvas.width,
            0,
            0,
            canvas.height / render.canvas.height,
            0,
            0,
        );
        context.clearRect(0, 0, render.canvas.width, render.canvas.height);
        if (!selectedLimb) return;
        const image = imagesRef.current.get(selectedLimb.limbKey);
        if (!image) return;
        context.save();
        context.globalAlpha = 0.72;
        context.filter = 'brightness(1.8) saturate(0.45) sepia(0.65)';
        context.drawImage(
            image,
            selectedLimb.bounds.x,
            selectedLimb.bounds.y,
            selectedLimb.bounds.width,
            selectedLimb.bounds.height,
        );
        context.restore();
    }, [fallbackReason, fit.height, fit.width, render?.canvas, selectedLimb]);

    useEffect(() => {
        let cancelled = false;
        imagesRef.current = new Map();
        setStatus('loading');
        setFallbackReason('');
        if (!render?.canvas || !limbs.length) return undefined;

        Promise.allSettled(limbs.map(async (limb) => {
            const image = await loadImage(limb.image.publicUrl);
            return [limb.limbKey, image];
        })).then(async (results) => {
            if (cancelled) return;
            const failed = results.filter((result) => result.status === 'rejected');
            results.forEach((result) => {
                if (result.status === 'fulfilled') imagesRef.current.set(...result.value);
            });
            if (failed.length) {
                setFallbackReason(`${failed.length} anatomy layer${failed.length === 1 ? '' : 's'} could not be loaded.`);
                setStatus('fallback');
                return;
            }
            try {
                const hitImage = await loadImage(render.hitMap.publicUrl);
                if (cancelled) return;
                const hitCanvas = hitCanvasRef.current;
                hitCanvas.width = render.canvas.width;
                hitCanvas.height = render.canvas.height;
                hitCanvas.getContext('2d', { willReadFrequently: true }).drawImage(hitImage, 0, 0);
                hitCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 1, 1);
                setStatus('ready');
            } catch (error) {
                if (!cancelled) {
                    setFallbackReason(error?.name === 'SecurityError'
                        ? 'The hit-map is blocked by asset CORS settings.'
                        : 'The anatomy hit-map could not be loaded.');
                    setStatus('fallback');
                }
            }
        });
        return () => {
            cancelled = true;
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [limbs, render?.canvas, render?.hitMap?.publicUrl, render?.renderHash]);

    useEffect(drawDisplay, [drawDisplay, status]);
    useEffect(drawHighlight, [drawHighlight, selectedKey, status]);

    const selectFromPointer = useCallback((event) => {
        if (status !== 'ready') return;
        const canvas = displayCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const sourceX = Math.floor((event.clientX - rect.left) * render.canvas.width / rect.width);
        const sourceY = Math.floor((event.clientY - rect.top) * render.canvas.height / rect.height);
        try {
            const pixel = hitCanvasRef.current
                .getContext('2d', { willReadFrequently: true })
                .getImageData(sourceX, sourceY, 1, 1).data;
            const limb = limbByColor.get(colorKey(pixel[0], pixel[1], pixel[2]));
            if (limb) {
                setSelectedKey(limb.limbKey);
                setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top, name: limb.name });
            } else {
                setPointer(null);
            }
        } catch (error) {
            setFallbackReason(error?.name === 'SecurityError'
                ? 'The hit-map is blocked by asset CORS settings.'
                : 'The hit-map cannot be read in this browser.');
            setStatus('fallback');
        }
    }, [limbByColor, render?.canvas, status]);

    const handlePointerMove = useCallback((event) => {
        if (event.pointerType === 'touch') return;
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        const point = { clientX: event.clientX, clientY: event.clientY };
        frameRef.current = requestAnimationFrame(() => selectFromPointer(point));
    }, [selectFromPointer]);

    if (!render || !limbs.length) return null;

    return (
        <section className="creature-anatomy" aria-labelledby="creature-anatomy-title">
            <header className="creature-anatomy-header">
                <div>
                    <h2 id="creature-anatomy-title">Anatomy</h2>
                    <p>Interactive limb map · {render.poseKey?.replaceAll('_', ' ') || 'default pose'}</p>
                </div>
                <span className="creature-anatomy-status" data-state={status}>
                    {status === 'loading' ? 'Loading render' : status === 'fallback' ? 'Fallback view' : `${limbs.length} limbs`}
                </span>
            </header>

            <div className="creature-anatomy-grid">
                <div className="creature-anatomy-stage" ref={stageRef} aria-label={`${creatureName} anatomy scene`}>
                    {status === 'loading' && <p className="creature-anatomy-loading">Calibrating anatomy scan…</p>}
                    {fallbackReason ? (
                        <div className="creature-anatomy-fallback">
                            <img src={render.fallbackComposite.publicUrl} alt={`${creatureName} anatomy composite`} />
                            <p>{fallbackReason} The static composite remains available.</p>
                        </div>
                    ) : (
                        <>
                            <canvas
                                ref={displayCanvasRef}
                                className="creature-anatomy-canvas"
                                aria-hidden="true"
                                style={{ width: fit.width, height: fit.height, left: fit.left, top: fit.top }}
                                onPointerMove={handlePointerMove}
                                onPointerUp={selectFromPointer}
                                onPointerLeave={() => setPointer(null)}
                            />
                            <canvas
                                ref={overlayCanvasRef}
                                className="creature-anatomy-overlay"
                                aria-hidden="true"
                                style={{ width: fit.width, height: fit.height, left: fit.left, top: fit.top }}
                            />
                            {pointer && (
                                <span className="creature-anatomy-tooltip" style={{ left: pointer.x, top: pointer.y }}>
                                    {pointer.name}
                                </span>
                            )}
                        </>
                    )}
                    <canvas ref={hitCanvasRef} className="creature-anatomy-hit-map" aria-hidden="true" />
                </div>

                <aside className="creature-anatomy-inspector" aria-label="Selected limb information">
                    {selectedLimb ? (
                        <>
                            <div className="creature-anatomy-selection">
                                <span>Selected limb</span>
                                <h3>{selectedLimb.name}</h3>
                                <p>{selectedLimb.type || 'Unclassified'}</p>
                            </div>
                            <dl className="creature-anatomy-data">
                                {selectedLimb.healthIndex !== null && selectedLimb.healthIndex !== undefined && (
                                    <div><dt>Health index</dt><dd>{selectedLimb.healthIndex}</dd></div>
                                )}
                                <div><dt>Mapping</dt><dd>{selectedLimb.mappingStatus?.replaceAll('_', ' ') || 'Unmapped'}</dd></div>
                            </dl>
                            <div className="creature-anatomy-modifiers">
                                <h4>Damage multipliers</h4>
                                {selectedLimb.damageModifiers.length ? (
                                    <ul>
                                        {selectedLimb.damageModifiers.map((modifier, index) => (
                                            <li key={`${modifier.afflictionType}-${modifier.afflictionIdentifier}-${index}`}>
                                                <span>{modifier.afflictionIdentifier || modifier.afflictionType || 'All damage'}</span>
                                                <strong>{multiplierLabel(modifier.multiplier)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p>No limb-specific multiplier data.</p>}
                            </div>
                            {selectedLimb.mappingStatus !== 'EXACT_NAME' && selectedLimb.mappingStatus !== 'HEALTH_INDEX' && (
                                <p className="creature-anatomy-warning">Health data link is approximate or unavailable.</p>
                            )}
                        </>
                    ) : <p>Select a limb to inspect it.</p>}
                </aside>
            </div>

            <div className="creature-anatomy-limb-list" aria-label="Creature limbs">
                {limbs.map((limb) => (
                    <button
                        type="button"
                        key={limb.limbKey}
                        aria-pressed={selectedLimb?.limbKey === limb.limbKey}
                        onClick={() => setSelectedKey(limb.limbKey)}
                    >
                        <span>{limb.name}</span>
                        <small>{limb.type || 'Unclassified'}</small>
                    </button>
                ))}
            </div>
            {render.warnings?.length > 0 && (
                <details className="creature-anatomy-render-notes">
                    <summary>Render notes · {render.warnings.length}</summary>
                    <ul>
                        {render.warnings.map((warning, index) => (
                            <li key={`${warning}-${index}`}>{warning}</li>
                        ))}
                    </ul>
                </details>
            )}
            <p className="sr-only" aria-live="polite">
                {selectedLimb ? `${selectedLimb.name} selected` : 'No limb selected'}
            </p>
        </section>
    );
}

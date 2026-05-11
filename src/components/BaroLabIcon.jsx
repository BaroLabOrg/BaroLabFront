import iconSvg from '../icon.svg?raw';

export default function BaroLabIcon({ className = '', width = 20, height = 27, ...props }) {
    const svgWithSize = iconSvg
        .replace(/width="110"/, `width="${width}"`)
        .replace(/height="147"/, `height="${height}"`);

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: svgWithSize }}
            {...props}
        />
    );
}

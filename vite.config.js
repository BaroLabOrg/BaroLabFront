import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const CORE_VENDOR_PACKAGES = new Set([
    'react',
    'react-dom',
    'react-router',
    'react-router-dom',
]);

const MARKDOWN_PACKAGE_PREFIXES = [
    'react-markdown',
    'remark-',
    'rehype-',
    'micromark',
    'mdast-',
    'hast-',
    'unist-',
    'unified',
    'vfile',
    'html-url-attributes',
    'property-information',
    'space-separated-tokens',
    'comma-separated-tokens',
    'decode-named-character-reference',
    'character-entities',
    'parse-entities',
];

function getNodeModulePackageName(normalizedId) {
    const marker = '/node_modules/';
    const markerIndex = normalizedId.lastIndexOf(marker);
    if (markerIndex === -1) return null;

    const dependencyPath = normalizedId.slice(markerIndex + marker.length);
    const segments = dependencyPath.split('/');
    if (segments[0]?.startsWith('@')) {
        return `${segments[0]}/${segments[1] || ''}`;
    }

    return segments[0] || null;
}

function isMarkdownEcosystemPackage(packageName) {
    return MARKDOWN_PACKAGE_PREFIXES.some((prefix) => packageName.startsWith(prefix));
}

export default defineConfig({
    plugins: [react()],
    build: {
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    const normalizedId = id.replaceAll('\\', '/');
                    const packageName = getNodeModulePackageName(normalizedId);

                    if (packageName) {
                        if (isMarkdownEcosystemPackage(packageName)) {
                            return 'vendor-markdown';
                        }

                        if (packageName === '@react-oauth/google') {
                            return 'vendor-auth';
                        }

                        if (CORE_VENDOR_PACKAGES.has(packageName)) {
                            return 'vendor';
                        }
                    }

                    if (
                        normalizedId.includes('/src/api/submarines')
                        || normalizedId.includes('/src/api/steamSync')
                    ) {
                        return 'domain-api';
                    }

                    return undefined;
                },
            },
        },
    },
    server: {
        port: 5173,
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: true,
    },
});

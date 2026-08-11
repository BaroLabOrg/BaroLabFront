const TOKEN_PATTERN = /\[(\/)?([a-z][a-z0-9]*|\*)(?:=([^\]\r\n]*))?\]/gi;
const SELF_CLOSING_TAGS = new Set(['br', 'hr']);
const RAW_CONTENT_TAGS = new Set(['code', 'noparse']);
const BLOCK_TAGS = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'quote', 'code', 'list', 'olist', 'table', 'tr', 'spoiler', 'hr', 'br', 'li',
]);

function textNode(value) {
    return { type: 'text', value };
}

function tagNode(tag, attribute = '') {
    return { type: 'tag', tag, attribute, children: [] };
}

function appendText(container, value) {
    if (!value) return;
    const last = container.children.at(-1);
    if (last?.type === 'text') {
        last.value += value;
    } else {
        container.children.push(textNode(value));
    }
}

function findOpenTag(stack, tag) {
    for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) return index;
    }
    return -1;
}

export function parseSteamBbcode(source) {
    const input = String(source || '').replace(/\r\n?/g, '\n');
    const lowerInput = input.toLowerCase();
    const root = { type: 'root', children: [] };
    const stack = [root];
    const pattern = new RegExp(TOKEN_PATTERN.source, TOKEN_PATTERN.flags);
    let cursor = 0;
    let match;

    while ((match = pattern.exec(input)) !== null) {
        const current = stack.at(-1);
        appendText(current, input.slice(cursor, match.index));

        const rawToken = match[0];
        const closing = Boolean(match[1]);
        const tag = match[2].toLowerCase();
        const attribute = (match[3] || '').trim();
        cursor = pattern.lastIndex;

        if (closing) {
            const openIndex = findOpenTag(stack, tag);
            if (openIndex < 0) {
                appendText(current, rawToken);
            } else {
                stack.length = openIndex;
            }
            continue;
        }

        if (tag === '*') {
            const listIndex = Math.max(findOpenTag(stack, 'list'), findOpenTag(stack, 'olist'));
            if (listIndex < 0) {
                appendText(current, rawToken);
                continue;
            }
            stack.length = listIndex + 1;
            const item = tagNode('li');
            stack.at(-1).children.push(item);
            stack.push(item);
            continue;
        }

        if (RAW_CONTENT_TAGS.has(tag)) {
            const closingToken = `[/${tag}]`;
            const closeIndex = lowerInput.indexOf(closingToken, pattern.lastIndex);
            if (closeIndex >= 0) {
                const node = tagNode(tag, attribute);
                node.children.push(textNode(input.slice(pattern.lastIndex, closeIndex)));
                stack.at(-1).children.push(node);
                pattern.lastIndex = closeIndex + closingToken.length;
                cursor = pattern.lastIndex;
                continue;
            }
        }

        const node = tagNode(tag, attribute);
        stack.at(-1).children.push(node);
        if (!SELF_CLOSING_TAGS.has(tag)) {
            stack.push(node);
        }
    }

    appendText(stack.at(-1), input.slice(cursor));
    return root.children;
}

export function steamBbcodeToPlainText(source) {
    const nodes = parseSteamBbcode(source);
    let output = '';

    const visit = (node) => {
        if (node.type === 'text') {
            output += node.value;
            return;
        }
        if (node.tag === 'img' || node.tag === 'previewicon') return;

        const block = BLOCK_TAGS.has(node.tag);
        if (block && output && !output.endsWith('\n')) output += '\n';
        if (node.tag === 'li') output += '• ';
        node.children.forEach(visit);
        if (block && !output.endsWith('\n')) output += '\n';
    };

    nodes.forEach(visit);

    return output
        .replace(/[\t\v\f ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function steamBbcodeToExcerpt(source, maxLength = 180) {
    const plain = steamBbcodeToPlainText(source).replace(/\s+/g, ' ').trim();
    if (plain.length <= maxLength) return plain;

    const candidate = plain.slice(0, maxLength + 1);
    const lastSpace = candidate.lastIndexOf(' ');
    const end = lastSpace >= Math.floor(maxLength * 0.65) ? lastSpace : maxLength;
    return `${plain.slice(0, end).trimEnd()}…`;
}

export function sanitizeSteamUrl(value) {
    const candidate = String(value || '').trim().replace(/^(["'])(.*)\1$/, '$2');
    if (!candidate) return null;
    try {
        const url = new URL(candidate);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

export function nodeText(nodes) {
    return (Array.isArray(nodes) ? nodes : [])
        .map((node) => (node.type === 'text' ? node.value : nodeText(node.children)))
        .join('');
}

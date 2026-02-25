// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import {readFile, writeFile, log} from './utils.js';

const SRC_DIR = 'src';
const LOCALES_DIR = 'src/_locales';

/**
 * Parses a .config file into a Map of message IDs to their content.
 * @param {string} content
 * @returns {Map<string, string>}
 */
function parseLocale(content) {
    const messages = new Map();
    const lines = content.split('\n');
    let currentId = null;
    let currentMessage = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('@')) {
            if (currentId) {
                messages.set(currentId, currentMessage.join('\n').trim());
            }
            currentId = line.substring(1).trim();
            currentMessage = [];
        } else if (currentId !== null) {
            currentMessage.push(line);
        }
    }
    if (currentId) {
        messages.set(currentId, currentMessage.join('\n').trim());
    }
    return messages;
}

/**
 * Stringifies a Map of messages back into .config format.
 * @param {Map<string, string>} messages
 * @returns {string}
 */
function stringifyLocale(messages) {
    const lines = [];
    for (const [id, message] of messages) {
        lines.push(`@${id}`);
        lines.push(message);
        lines.push('');
    }
    return lines.join('\n');
}

/**
 * Scans the source directory for used message IDs.
 * @returns {Promise<Set<string>>}
 */
async function findUsedIds() {
    const usedIds = new Set();
    const walk = async (dir) => {
        const entries = await fs.readdir(dir, {withFileTypes: true});
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                    await walk(res);
                }
            } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json') || entry.name.endsWith('.js')) {
                const content = await readFile(res);
                
                const getLocalMessageRegex = /getLocalMessage\(['"]([a-zA-Z0-9_]+)['"]\)/g;
                let match;
                while ((match = getLocalMessageRegex.exec(content)) !== null) {
                    usedIds.add(match[1]);
                }

                const msgRegex = /__MSG_([a-zA-Z0-9_]+)__/g;
                while ((match = msgRegex.exec(content)) !== null) {
                    usedIds.add(match[1]);
                }
            }
        }
    };

    await walk(SRC_DIR);
    return usedIds;
}

async function removeUnusedLocales() {
    log('Finding used message IDs...');
    const usedIds = await findUsedIds();
    log(`Found ${usedIds.size} used message IDs.`);

    const localeFiles = (await fs.readdir(LOCALES_DIR)).filter(f => f.endsWith('.config'));

    for (const file of localeFiles) {
        const filePath = path.join(LOCALES_DIR, file);
        log(`Processing ${file}...`);
        const content = await readFile(filePath);
        const messages = parseLocale(content);
        
        let removedCount = 0;
        const cleanedMessages = new Map();

        for (const [id, message] of messages) {
            if (usedIds.has(id)) {
                cleanedMessages.set(id, message);
            } else {
                removedCount++;
            }
        }

        if (removedCount > 0) {
            await writeFile(filePath, stringifyLocale(cleanedMessages));
            log(`Removed ${removedCount} unused keys from ${file}.`);
        } else {
            log(`No unused keys found in ${file}.`);
        }
    }

    log.ok('Unused locales removed successfully.');
}

removeUnusedLocales().catch(err => {
    console.error(err);
    process.exit(1);
});

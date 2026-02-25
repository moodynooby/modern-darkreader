import type {Theme} from '../definitions';

const excludedSelectors = [
    'pre', 'pre *', 'code',
    '[aria-hidden="true"]',

    '[class*="fa-"]',
    '.fa', '.fab', '.fad', '.fal', '.far', '.fas', '.fass', '.fasr', '.fat',

    '.icofont', '[style*="font-"]',
    '[class*="icon"]', '[class*="Icon"]',
    '[class*="symbol"]', '[class*="Symbol"]',

    '.glyphicon',

    '[class*="material-symbol"]', '[class*="material-icon"]',

    'mu', '[class*="mu-"]',

    '.typcn',

    '[class*="vjs-"]',
];

export function createTextStyle(config: Theme): string {
    const lines: string[] = [];
    lines.push(`*:not(${excludedSelectors.join(', ')}) {`);

    if (config.useFont && config.fontFamily) {
        lines.push(`  font-family: ${config.fontFamily} !important;`);
    }

    if (config.textStroke > 0) {
        lines.push(`  -webkit-text-stroke: ${config.textStroke}px !important;`);
        lines.push(`  text-stroke: ${config.textStroke}px !important;`);
    }

    lines.push('}');

    return lines.join('\n');
}

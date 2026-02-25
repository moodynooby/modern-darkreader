import {forEach} from '../../utils/array';
import {isLayerRuleSupported, isSafari} from '../../utils/platform';
import {escapeRegExpSpecialChars} from '../../utils/text';
import {parseURL, getAbsoluteURL} from '../../utils/url';
import {logInfo, logWarn} from '../utils/log';

export function iterateCSSRules(rules: CSSRuleList | CSSRule[] | Set<CSSRule>, iterate: (rule: CSSStyleRule) => void, onImportError?: () => void): void {
    forEach(rules, (rule) => {
        if (isStyleRule(rule)) {
            iterate(rule);
            if (rule.cssRules?.length > 0) {
                iterateCSSRules(rule.cssRules, iterate);
            }
        } else if (isImportRule(rule)) {
            try {
                iterateCSSRules(rule.styleSheet!.cssRules, iterate, onImportError);
            } catch (err) {
                logInfo(`Found a non-loaded link.`);
                onImportError?.();
            }
        } else if (isMediaRule(rule)) {
            const media = Array.from(rule.media);
            const isScreenOrAllOrQuery = media.some((m) => m.startsWith('screen') || m.startsWith('all') || m.startsWith('('));
            const isNotScreen = !isScreenOrAllOrQuery && media.some((m) => ignoredMedia.some((i) => m.startsWith(i)));

            if (isScreenOrAllOrQuery || !isNotScreen) {
                iterateCSSRules(rule.cssRules, iterate, onImportError);
            }
        } else if (isSupportsRule(rule)) {
            if (CSS.supports(rule.conditionText)) {
                iterateCSSRules(rule.cssRules, iterate, onImportError);
            }
        } else if (isLayerRule(rule)) {
            iterateCSSRules(rule.cssRules, iterate, onImportError);
        } else {
            logWarn(`CSSRule type not supported`, rule);
        }
    });
}

export const ignoredMedia = [
    'aural',
    'braille',
    'embossed',
    'handheld',
    'print',
    'projection',
    'speech',
    'tty',
    'tv',
];

const shorthandVarDependantProperties = [
    'background',
    'border',
    'border-color',
    'border-bottom',
    'border-left',
    'border-right',
    'border-top',
    'outline',
    'outline-color',
];

const shorthandVarDepPropRegexps = isSafari ? shorthandVarDependantProperties.map((prop) => {
    const regexp = new RegExp(`${prop}:\\s*(.*?)\\s*;`);
    return [prop, regexp] as [string, RegExp];
}) : null;

export function iterateCSSDeclarations(style: CSSStyleDeclaration, iterate: (property: string, value: string) => void): void {
    const cssText = style.cssText;
    if (cssText.includes('var(')) {
        if (isSafari) {
            shorthandVarDepPropRegexps!.forEach(([prop, regexp]) => {
                const match = cssText.match(regexp);
                if (match && match[1]) {
                    const val = match[1].trim();
                    iterate(prop, val);
                }
            });
        } else {
            shorthandVarDependantProperties.forEach((prop) => {
                const val = style.getPropertyValue(prop);
                if (val && val.includes('var(')) {
                    iterate(prop, val);
                }
            });
        }
    }

    if (
        (
            cssText.includes('background-color: ;') ||
            cssText.includes('background-image: ;')
        ) && !style.getPropertyValue('background')
    ) {
        handleEmptyShorthand('background', style, iterate);
    }
    if (cssText.includes('border-') && cssText.includes('-color: ;') && !style.getPropertyValue('border')) {
        handleEmptyShorthand('border', style, iterate);
    }

    forEach(style, (property) => {
        const value = style.getPropertyValue(property).trim();
        if (!value) {
            return;
        }
        iterate(property, value);
    });
}

function handleEmptyShorthand(shorthand: string, style: CSSStyleDeclaration, iterate: (property: string, value: string) => void) {
    const parentRule = style.parentRule;
    if (isStyleRule(parentRule)) {
        const sourceCSSText = parentRule.parentStyleSheet?.ownerNode?.textContent;
        if (sourceCSSText) {
            let escapedSelector = escapeRegExpSpecialChars(parentRule.selectorText);
            escapedSelector = escapedSelector.replaceAll(/\s+/g, '\\s*'); 
            escapedSelector = escapedSelector.replaceAll(/::/g, '::?'); 
            const regexp = new RegExp(`${escapedSelector}\\s*{[^}]*${shorthand}:\\s*([^;}]+)`);
            const match = sourceCSSText.match(regexp);
            if (match) {
                iterate(shorthand, match[1]);
            }
        } else if (shorthand === 'background') {
            iterate('background-color', '#ffffff');
            iterate('background-image', 'none');
        }
    }
}

export const cssURLRegex = /url\((('.*?')|(".*?")|([^\)]*?))\)/g;
export const cssImportRegex = /@import\s*(url\()?(('.+?')|(".+?")|([^\)]*?))\)? ?(screen)?;?/gi;

export function getCSSURLValue(cssURL: string): string {
    return cssURL.trim().replace(/[\n\r\\]+/g, '').replace(/^url\((.*)\)$/, '$1').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/(?:\\(.))/g, '$1');
}

export function getCSSBaseBath(url: string): string {
    const cssURL = parseURL(url);
    return `${cssURL.origin}${cssURL.pathname.replace(/\?.*$/, '').replace(/(\/)([^\/]+)$/i, '$1')}`;
}

export function replaceCSSRelativeURLsWithAbsolute($css: string, cssBasePath: string): string {
    return $css.replace(cssURLRegex, (match) => {
        try {
            const url = getCSSURLValue(match);
            const absoluteURL = getAbsoluteURL(cssBasePath, url);
            const escapedURL = absoluteURL.replaceAll('\'', '\\\'');
            return `url('${escapedURL}')`;
        } catch (err) {
            logWarn('Not able to replace relative URL with Absolute URL, skipping');
            return match;
        }
    });
}

const fontFaceRegex = /@font-face\s*{[^}]*}/g;

export function replaceCSSFontFace($css: string): string {
    return $css.replace(fontFaceRegex, '');
}

const styleRules = new WeakSet<CSSRule>();
const importRules = new WeakSet<CSSRule>();
const mediaRules = new WeakSet<CSSRule>();
const supportsRules = new WeakSet<CSSRule>();
const layerRules = new WeakSet<CSSRule>();

export function isStyleRule(rule: CSSRule | null): rule is CSSStyleRule {
    if (!rule) {
        return false;
    }
    if (styleRules.has(rule)) {
        return true;
    }
    if ((rule as CSSStyleRule).selectorText) {
        styleRules.add(rule);
        return true;
    }
    return false;
}

export function isImportRule(rule: CSSRule | null): rule is CSSImportRule {
    if (!rule) {
        return false;
    }
    if (styleRules.has(rule)) {
        return false;
    }
    if (importRules.has(rule)) {
        return true;
    }
    if ((rule as CSSImportRule).href) {
        importRules.add(rule);
        return true;
    }
    return false;
}

export function isMediaRule(rule: CSSRule | null): rule is CSSMediaRule {
    if (!rule) {
        return false;
    }
    if (styleRules.has(rule)) {
        return false;
    }
    if (mediaRules.has(rule)) {
        return true;
    }
    if ((rule as CSSMediaRule).media) {
        mediaRules.add(rule);
        return true;
    }
    return false;
}

export function isSupportsRule(rule: CSSRule | null): rule is CSSSupportsRule {
    if (!rule) {
        return false;
    }
    if (styleRules.has(rule)) {
        return false;
    }
    if (supportsRules.has(rule)) {
        return true;
    }
    if (rule instanceof CSSSupportsRule) {
        supportsRules.add(rule);
        return true;
    }
    return false;
}

export function isLayerRule(rule: CSSRule | null): rule is CSSLayerBlockRule {
    if (!rule) {
        return false;
    }
    if (styleRules.has(rule)) {
        return false;
    }
    if (layerRules.has(rule)) {
        return true;
    }
    if (isLayerRuleSupported && rule instanceof CSSLayerBlockRule) {
        layerRules.add(rule);
        return true;
    }
    return false;
}

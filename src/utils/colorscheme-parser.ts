const SEPERATOR = '='.repeat(32);

const backgroundPropertyLength = 'background: '.length;
const textPropertyLength = 'text: '.length;

// Should return a humanized version of the given number.
// TODO(Anton): rewrite me with case-default
// eslint-disable-next-line
// @ts-ignore
const humanizeNumber = (number: number): string => {
    if (number > 3) {
        return `${number}th`;
    }
    switch (number) {
        case 0:
            return '0';
        case 1:
            return '1st';
        case 2:
            return '2nd';
        case 3:
            return '3rd';
    }
};

const isValidHexColor = (color: string): boolean => {
    return /^#([0-9a-fA-F]{3}){1,2}$/.test(color);
};

interface ColorSchemeVariant {
    backgroundColor: string;
    textColor: string;
}

export interface ParsedColorSchemeConfig {
    light: { [name: string]: ColorSchemeVariant };
    dark: { [name: string]: ColorSchemeVariant };
}

export function parseColorSchemeConfig(config: string): { result: ParsedColorSchemeConfig; error: string | null } {
    const sections = config.split(`${SEPERATOR }\n\n`);

    const definedColorSchemeNames: Set<string> = new Set();
    let lastDefinedColorSchemeName: string | undefined = '';

    const definedColorSchemes: ParsedColorSchemeConfig = {
        light: {},
        dark: {},
    };

    let interrupt = false;
    let error: string | null = null;

    const throwError = (message: string) => {
        if (!interrupt) {
            interrupt = true;
            error = message;
        }
    };

    sections.forEach((section) => {
        if (interrupt) {
            return;
        }

        const lines = section.split('\n');

        const name = lines[0];
        if (!name) {
            throwError('No color scheme name was found.');
            return;
        }
        if (definedColorSchemeNames.has(name)) {
            throwError(`The color scheme name "${name}" is already defined.`);
            return;
        }
        if (lastDefinedColorSchemeName && lastDefinedColorSchemeName !== 'Default' && name.localeCompare(lastDefinedColorSchemeName) < 0) {
            throwError(`The color scheme name "${name}" is not in alphabetical order.`);
            return;
        }
        lastDefinedColorSchemeName = name;

        definedColorSchemeNames.add(name);

        if (lines[1]) {
            throwError(`The second line of the color scheme "${name}" is not empty.`);
            return;
        }

        const checkVariant = (lineIndex: number, isSecondVariant: boolean): (ColorSchemeVariant & { variant?: string }) | undefined => {
            const variant = lines[lineIndex];
            if (!variant) {
                throwError(`The third line of the color scheme "${name}" is not defined.`);
                return;
            }

            if (variant !== 'LIGHT' && variant !== 'DARK' && (isSecondVariant && variant === 'Light')) {
                throwError(`The ${humanizeNumber(lineIndex)} line of the color scheme "${name}" is not a valid variant.`);
                return;
            }

            const firstProperty = lines[lineIndex + 1];
            if (!firstProperty) {
                throwError(`The ${humanizeNumber(lineIndex + 1)} line of the color scheme "${name}" is not defined.`);
                return;
            }

            if (!firstProperty.startsWith('background: ')) {
                throwError(`The ${humanizeNumber(lineIndex + 1)} line of the color scheme "${name}" is not background-color property.`);
                return;
            }

            const backgroundColor = firstProperty.slice(backgroundPropertyLength);
            if (!isValidHexColor(backgroundColor)) {
                throwError(`The ${humanizeNumber(lineIndex + 1)} line of the color scheme "${name}" is not a valid hex color.`);
                return;
            }

            const secondProperty = lines[lineIndex + 2];
            if (!secondProperty) {
                throwError(`The ${humanizeNumber(lineIndex + 2)} line of the color scheme "${name}" is not defined.`);
                return;
            }
            if (!secondProperty.startsWith('text: ')) {
                throwError(`The ${humanizeNumber(lineIndex + 2)} line of the color scheme "${name}" is not text-color property.`);
                return;
            }
            const textColor = secondProperty.slice(textPropertyLength);
            if (!isValidHexColor(textColor)) {
                throwError(`The ${humanizeNumber(lineIndex + 2)} line of the color scheme "${name}" is not a valid hex color.`);
                return;
            }
            return {
                backgroundColor,
                textColor,
                variant,
            };
        };

        const firstVariant = checkVariant(2, false)!;
        const isFirstVariantLight = firstVariant.variant === 'LIGHT';
        delete firstVariant.variant;
        if (interrupt) {
            return;
        }
        let secondVariant: typeof firstVariant | null = null;
        let isSecondVariantLight = false;
        if (lines[6]) {
            secondVariant = checkVariant(6, true)!;
            isSecondVariantLight = secondVariant.variant === 'LIGHT';
            delete secondVariant.variant;
            if (interrupt) {
                return;
            }
            if (lines.length > 11 || lines[9] || lines[10]) {
                throwError(`The color scheme "${name}" doesn't end with 1 new line.`);
                return;
            }
        } else if (lines.length > 7) {
            throwError(`The color scheme "${name}" doesn't end with 1 new line.`);
            return;
        }
        if (secondVariant) {
            if (isFirstVariantLight === isSecondVariantLight) {
                throwError(`The color scheme "${name}" has the same variant twice.`);
                return;
            }
            if (isFirstVariantLight) {
                definedColorSchemes.light[name] = firstVariant;
                definedColorSchemes.dark[name] = secondVariant;
            } else {
                definedColorSchemes.light[name] = secondVariant;
                definedColorSchemes.dark[name] = firstVariant;
            }
        } else if (isFirstVariantLight) {
            definedColorSchemes.light[name] = firstVariant;
        } else {
            definedColorSchemes.dark[name] = firstVariant;
        }
    });

    return {result: definedColorSchemes, error: error};
}

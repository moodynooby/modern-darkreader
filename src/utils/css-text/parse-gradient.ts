import {getParenthesesRange} from '../text';

const gradientLength = 'gradient'.length;
const conicGradient = 'conic-';
const conicGradientLength = conicGradient.length;
const radialGradient = 'radial-';
const linearGradient = 'linear-';

export interface ParsedGradient {
    typeGradient: string;
    match: string;
    hasComma: boolean;
    index: number;
    offset: number;
}

export function parseGradient(value: string): ParsedGradient[] {
    const result: ParsedGradient[] = [];

    let index = 0;
    let startIndex = conicGradient.length;
    while ((index = value.indexOf('gradient', startIndex)) !== -1) {
        let typeGradient: string | undefined;
        [linearGradient, radialGradient, conicGradient].find((possibleType) => {
            if (index - possibleType.length >= 0) {
                const possibleGradient = value.substring(index - possibleType.length, index);
                if (possibleGradient === possibleType) {
                    if (value.slice(index - possibleType.length - 10, index - possibleType.length - 1) === 'repeating') {
                        typeGradient = `repeating-${possibleType}gradient`;
                        return true;
                    }
                    if (value.slice(index - possibleType.length - 8, index - possibleType.length - 1) === '-webkit') {
                        typeGradient = `-webkit-${possibleType}gradient`;
                        return true;
                    }
                    typeGradient = `${possibleType}gradient`;
                    return true;
                }
            }
        });

        if (!typeGradient) {
            break;
        }

        const {start, end} = getParenthesesRange(value, index + gradientLength)!;

        const match = value.substring(start + 1, end - 1);
        startIndex = end + 1 + conicGradientLength;

        result.push({
            typeGradient,
            match,
            offset: typeGradient.length + 2,
            index: index - typeGradient.length + gradientLength,
            hasComma: true,
        });
    }

    if (result.length) {
        result[result.length - 1].hasComma = false;
    }


    return result;
}

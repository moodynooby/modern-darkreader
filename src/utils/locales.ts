export function getLocalMessage(messageName: string): string {
    return chrome.i18n.getMessage(messageName) || messageName;
}

export function getUILanguage(): string {
    let code: string;
    if ('i18n' in chrome && 'getUILanguage' in chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        code = chrome.i18n.getUILanguage();
    } else {
        code = navigator.language.split('-')[0];
    }
    if (code.endsWith('-mac')) {
        return code.substring(0, code.length - 4);
    }
    return code;
}

import {isOpera} from '../../utils/platform';

// On Opera, sender.tab.index === -1.
export function isPanel(sender: chrome.runtime.MessageSender): boolean {
    return typeof sender === 'undefined' || typeof sender.tab === 'undefined' || (isOpera && sender.tab.index === -1);
}

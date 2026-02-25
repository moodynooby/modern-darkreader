import type {MessageCStoBG, MessageUItoBG} from '../definitions';
import {MessageTypeCStoBG, MessageTypeUItoBG} from '../utils/message';

import {isPanel} from './utils/tab';

declare const __CHROMIUM_MV2__: boolean;

export function makeChromiumHappy(): void {
    if (!__CHROMIUM_MV2__) {
        return;
    }
    chrome.runtime.onMessage.addListener((message: MessageUItoBG | MessageCStoBG, sender, sendResponse) => {
        if (![
            MessageTypeUItoBG.GET_DATA,
            MessageTypeUItoBG.APPLY_DEV_DYNAMIC_THEME_FIXES,
            MessageTypeUItoBG.APPLY_DEV_INVERSION_FIXES,
            MessageTypeUItoBG.APPLY_DEV_STATIC_THEMES,
        ].includes(message.type as MessageTypeUItoBG) &&
            (message.type !== MessageTypeCStoBG.DOCUMENT_CONNECT || !isPanel(sender))) {
            sendResponse({type: '¯\\_(ツ)_/¯'});
        }
    });
}

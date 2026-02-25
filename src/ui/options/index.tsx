import {m} from 'malevic';
import {sync} from 'malevic/dom';

import type {ExtensionData} from '../../definitions';
import {isFirefox, isMobile} from '../../utils/platform';
import Connector from '../connect/connector';
import {setupDebugHotReload} from '../debug-hotreload';

import Body from './body/body';

declare const __CHROMIUM_MV3__: boolean;

function renderBody(data: ExtensionData, actions: Connector) {
    sync(document.body, <Body data={data} actions={actions} />);
}

async function start(): Promise<void> {
    const connector = new Connector();
    window.addEventListener('unload', () => connector.disconnect(), {passive: true});

    const data = await connector.getData();
    renderBody(data, connector);
    connector.subscribeToChanges(async (newData) => {
        renderBody(newData, connector);
    });
}

document.documentElement.classList.toggle('mobile', isMobile);
document.documentElement.classList.toggle('firefox', isFirefox);

start();

declare const __DEBUG__: boolean;
if (__DEBUG__) {
    setupDebugHotReload();
}

if (__CHROMIUM_MV3__) {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
        if (message === 'getExtensionPageTabMV3_ping') {
            sendResponse('getExtensionPageTabMV3_pong');
        }
    });
}

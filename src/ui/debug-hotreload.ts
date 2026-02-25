import type {DebugMessageBGtoCS, DebugMessageBGtoUI} from '../definitions';
import {DebugMessageTypeBGtoUI} from '../utils/message';

export function setupDebugHotReload(): void {
    chrome.runtime.onMessage.addListener(({type}: DebugMessageBGtoCS | DebugMessageBGtoUI) => {
        if (type === DebugMessageTypeBGtoUI.CSS_UPDATE) {
            document.querySelectorAll('link[rel="stylesheet"]').forEach((link: HTMLLinkElement) => {
                const url = link.href;
                link.disabled = true;
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = url.replace(/\?.*$/, `?nocache=${Date.now()}`);
                link.parentElement!.insertBefore(newLink, link);
                link.remove();
            });
        }

        if (type === DebugMessageTypeBGtoUI.UPDATE) {
            location.reload();
        }
    });
}

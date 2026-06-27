export function fixNotClosingPopupOnNavigation(): void {
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button === 2) {
            return;
        }
        let target = e.target as HTMLElement;
        while (target && !(target instanceof HTMLAnchorElement)) {
            target = target.parentElement!;
        }
        if (target && target.hasAttribute('href')) {
            chrome.tabs.create({url: target.getAttribute('href')!});
            e.preventDefault();
            window.close();
        }
    });
}

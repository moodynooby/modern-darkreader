import {m} from 'malevic';

import type {Shortcuts} from '../../../definitions';
import {isFirefox, isEdge} from '../../../utils/platform';
import {mergeClass} from '../utils';

interface ShortcutLinkProps {
    class?: string | {[cls: string]: any};
    commandName: string;
    shortcuts: Shortcuts;
    textTemplate: (shortcut: string | null) => string;
    onSetShortcut: (shortcut: string) => Promise<string | null>;
}

/**
 * Displays a shortcut and navigates
 * to Chrome Commands page on click.
 */
export default function ShortcutLink(props: ShortcutLinkProps) {
    const shortcut = props.shortcuts[props.commandName];
    const shortcutMessage = props.textTemplate(shortcut);
    const cls = mergeClass('shortcut', [shortcut ? 'shortcut--set' : null, props.class]);

    let enteringShortcutInProgress = false;

    function startEnteringShortcut(node: HTMLAnchorElement) {
        if (enteringShortcutInProgress) {
            return;
        }
        enteringShortcutInProgress = true;

        const initialText = node.textContent;
        node.textContent = '...⌨';

        let ctrl = false, alt = false, command = false, shift = false, key: string | null = null;

        function updateShortcut() {
            if (!enteringShortcutInProgress) {
                return;
            }
            const shortcut = `${ctrl ? 'Ctrl+' : ''}${alt ? 'Alt+' : command ? 'Command+' : ''}${shift ? 'Shift+' : ''}${key ? key : ''}`;
            node.textContent = shortcut;
        }

        function onKeyDown(e: KeyboardEvent) {
            e.preventDefault();
            ctrl = e.ctrlKey;
            alt = e.altKey;
            command = e.metaKey;
            shift = e.shiftKey;

            key = null;
            if (e.key === '.') {
                key = 'Period';
            } else if (e.key === ',') {
                key = 'Comma';
            } else if (/^Digit[0-9]$/.test(e.code)) {
                key = e.code.substring(5, 6);
            } else if (/^Key[A-Z]$/.test(e.code)) {
                if (/^[A-Za-z]$/.test(e.key)) {
                    key = e.key.toUpperCase();
                } else if (e.keyCode !== 0) {
                    key = e.code.substring(3);
                }
            }

            updateShortcut();

            if ((ctrl || alt || command || shift) && key) {
                removeListeners();
                node.blur();
                const shortcut = `${ctrl ? 'Ctrl+' : ''}${alt ? 'Alt+' : command ? 'Command+' : ''}${shift ? 'Shift+' : ''}${key ? key : ''}`;
                props.onSetShortcut(shortcut).then((shortcut) => {
                    enteringShortcutInProgress = false;
                    node.classList.remove('shortcut--edit');
                    node.textContent = props.textTemplate(shortcut);
                });
            }
        }

        function onKeyUp(e: KeyboardEvent) {
            if (e.key === 'Control') {
                ctrl = false;
            } else if (e.key === 'Alt') {
                alt = false;
            } else if (e.key === 'Command') {
                command = false;
            } else if (e.key === 'Shift') {
                shift = false;
            } else {
                key = null;
            }
            updateShortcut();
        }

        function onBlur() {
            removeListeners();
            node.classList.remove('shortcut--edit');
            if (enteringShortcutInProgress) {
                node.textContent = initialText;
            }
            enteringShortcutInProgress = false;
        }

        function removeListeners() {
            window.removeEventListener('keydown', onKeyDown, {capture: true, passive: false, once: false} as EventListenerOptions);
            window.removeEventListener('keyup', onKeyUp, {capture: true, passive: false, once: false} as EventListenerOptions);
            window.removeEventListener('blur', onBlur, {capture: true, once: true} as EventListenerOptions);
        }

        window.addEventListener('keydown', onKeyDown, {capture: true, passive: false, once: false});
        window.addEventListener('keyup', onKeyUp, {capture: true, passive: false, once: false});
        window.addEventListener('blur', onBlur, {capture: true, once: true});
        node.classList.add('shortcut--edit');
    }

    function onClick(e: Event) {
        e.preventDefault();
        if (isFirefox) {
            startEnteringShortcut(e.target as HTMLAnchorElement);
            return;
        }
        if (isEdge) {
            chrome.tabs.create({
                url: `edge://extensions/shortcuts`,
                active: true,
            });
            return;
        }
        chrome.tabs.create({
            url: `chrome://extensions/configureCommands#command-${chrome.runtime.id}-${props.commandName}`,
            active: true,
        });
    }

    function onRender(node: HTMLAnchorElement) {
        node.textContent = shortcutMessage;
    }

    return (
        <a
            class={cls}
            href="#"
            onclick={onClick}
            oncreate={onRender}
        ></a>
    );
}

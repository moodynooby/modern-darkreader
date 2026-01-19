import {m} from 'malevic';
import {getContext} from 'malevic/dom';

import type {ViewProps} from '../../../definitions';
import {Overlay} from '../../controls';
import {AdvancedTab} from '../advanced/advanced-tab';
import {AutomationTab} from '../automation/automation-tab';
import {GeneralTab} from '../general/general-tab';
import {HotkeysTab} from '../hotkeys/hotkeys-tab';
import {SiteListTab} from '../site-list/site-list-tab';
import TabPanel from '../tab-panel/tab-panel';

type BodyProps = ViewProps;

export default function Body(props: BodyProps): Malevic.Child {
    const context = getContext();
    const store = context.getStore({activeTabId: 'general'});

    function onSettingsTabChange(tabId: string) {
        store.activeTabId = tabId;
        context.refresh();
    }
    return (
        <body>
            <header>
                <div class="header-main">
                    <h1 id="title">Lean Dark+ Settings</h1>
                </div>
                <div className="header-buttons">
                    <a href="mailto:immanasdoshi@gmail.com" target="_blank" class="header-button" role="button">
                        <svg class="header-button__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                        <span>Contact</span>
                    </a>
                    <a href="https://ko-fi.com/U7U51S87CX" target="_blank" class="header-button header-button--coffee" role="button">
                        <svg class="header-button__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" /></svg>
                        <span>Support</span>
                    </a>
                </div>
            </header>
            <TabPanel
                activeTabId={store.activeTabId}
                onTabChange={onSettingsTabChange}
            >
                <TabPanel.Tab
                    id="general"
                    label="General"
                    iconClass="settings-icon-general"
                >
                    <GeneralTab {...props} />
                </TabPanel.Tab>
                <TabPanel.Tab
                    id="site-list"
                    label="Site List"
                    iconClass="settings-icon-list"
                >
                    <SiteListTab {...props} />
                </TabPanel.Tab>
                <TabPanel.Tab
                    id="automation"
                    label="Automation"
                    iconClass="settings-icon-auto"
                >
                    <AutomationTab {...props} />
                </TabPanel.Tab>
                <TabPanel.Tab
                    id="hotkeys"
                    label="Hotkeys"
                    iconClass="settings-icon-hotkeys"
                >
                    <HotkeysTab {...props} />
                </TabPanel.Tab>
                <TabPanel.Tab
                    id="advanced"
                    label="Advanced"
                    iconClass="settings-icon-advanced"
                >
                    <AdvancedTab {...props} />
                </TabPanel.Tab>
            </TabPanel>
            <Overlay />
        </body>
    );
}

/*
    Copyright (C) 2022-2023 KKonaOG
*/
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

export class GenLiteUIPlugin {
    public static pluginName = 'GenLiteUIPlugin';

    private sidePanel: HTMLElement;
    private tabBar: HTMLElement;
    private tabContentHeader: HTMLElement;
    private tabContentHolder: HTMLElement;
    private settingsTab: HTMLElement;

    private pluginTabs = {};
    private pluginSettings : Map<string, HTMLElement> = new Map<string, HTMLElement>();



    async init() {
        // Main Side Panel Element
        this.sidePanel = document.createElement('div');
        this.sidePanel.id = 'genlite-ui';
        this.sidePanel.style.position = 'absolute';
        this.sidePanel.style.top = '0';
        this.sidePanel.style.right = '-302px';
        this.sidePanel.style.width = '300px';
        this.sidePanel.style.height = '100%';
        this.sidePanel.style.zIndex = '9999';
        this.sidePanel.style.color = 'white';
        this.sidePanel.style.transition = 'right 0.5s ease-in-out';
        this.sidePanel.style.fontFamily = 'acme, times new roman, Times, serif';



        // Tab Bar portion of the Side Panel (Right Side)
        this.tabBar = document.createElement('div');
        this.tabBar.id = 'genlite-ui-tab-bar';
        this.tabBar.style.position = 'absolute';
        this.tabBar.style.top = '0';
        this.tabBar.style.right = '0';
        this.tabBar.style.width = '50px';
        this.tabBar.style.height = '100%';
        this.tabBar.style.backgroundColor = 'rgba(30, 30, 30, 1)';
        this.tabBar.style.borderLeft = '1px solid rgba(0, 0, 0, 1)';
        this.sidePanel.appendChild(this.tabBar);

        // Tab Content Header
        this.tabContentHeader = document.createElement('div');
        this.tabContentHeader.id = 'genlite-ui-tab-content-header';
        this.tabContentHeader.style.position = 'absolute';
        this.tabContentHeader.style.top = '0px';
        this.tabContentHeader.style.right = '51px';
        this.tabContentHeader.style.width = 'calc(100% - 50px)';
        this.tabContentHeader.style.height = '50px';
        this.tabContentHeader.style.backgroundColor = 'rgba(42, 40, 40, 1)';
        this.tabContentHeader.style.borderRight = '1px solid rgba(66, 66, 66, 1)';
        this.tabContentHeader.style.borderBottom = '1px solid rgba(66, 66, 66, 1)';
        this.tabContentHeader.style.display = 'flex';
        this.tabContentHeader.style.justifyContent = 'center';
        this.tabContentHeader.style.alignItems = 'center';
        this.tabContentHeader.style.fontSize = '20px';
        this.tabContentHeader.style.fontWeight = 'bold';
        this.tabContentHeader.style.textShadow = '0px 0px 2px rgba(0, 0, 0, 1)';
        this.sidePanel.appendChild(this.tabContentHeader);

        // Tab Content Holder
        this.tabContentHolder = document.createElement('div');
        this.tabContentHolder.id = 'genlite-ui-tab-content-holder';
        this.tabContentHolder.style.position = 'absolute';
        this.tabContentHolder.style.top = '51px';
        this.tabContentHolder.style.right = '51px';
        this.tabContentHolder.style.width = 'calc(100% - 50px)';
        this.tabContentHolder.style.height = 'calc(100% - 50px)';
        this.tabContentHolder.style.backgroundColor = 'rgba(42, 40, 40, 1)';
        this.tabContentHolder.style.borderTop = '1px solid rgba(0, 0, 0, 1)';
        this.tabContentHolder.style.borderRight = '1px solid rgba(66, 66, 66, 1)';
        this.sidePanel.appendChild(this.tabContentHolder);


        // Add a open/close button to the top-left of the Side Panel
        const visibilityButton = document.createElement('div');
        visibilityButton.id = 'genlite-ui-close-button';
        visibilityButton.style.position = 'absolute';
        visibilityButton.style.top = '5px';
        visibilityButton.style.left = '-22px';
        visibilityButton.style.width = '20px';
        visibilityButton.style.height = '20px';
        visibilityButton.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
        visibilityButton.style.cursor = 'pointer';
        visibilityButton.style.display = 'flex';
        visibilityButton.style.justifyContent = 'center';
        visibilityButton.style.alignItems = 'center';
        visibilityButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        visibilityButton.style.transition = 'transform 0.5s ease-in-out';
        visibilityButton.addEventListener('click', () => {
            if (this.sidePanel.style.right === '-302px') {
                this.sidePanel.style.right = '0';
                visibilityButton.style.transform = 'rotate(180deg)';
            } else {
                this.sidePanel.style.right = '-302px';
                visibilityButton.style.transform = 'rotate(0deg)';
            }
        });
        this.sidePanel.appendChild(visibilityButton);

        // Plugin List Tab
        this.settingsTab = document.createElement('div');
        this.settingsTab.id = 'genlite-ui-settings-tab';
        this.settingsTab.style.position = 'absolute';
        this.settingsTab.style.top = '0';
        this.settingsTab.style.left = '0';
        this.settingsTab.style.width = '100%';
        this.settingsTab.style.height = '100%';
        this.addTab('list', "Plugins", this.settingsTab);

        // Add the side panel to the body
        document.body.appendChild(this.sidePanel);

        // Set Initial View
        this.showTab('Plugins');
    }


    addTab(icon: string, tabName: string, tabContent: HTMLElement, initiallyVisible: boolean = true) {
        // Create the tab button
        const tabButton = document.createElement('div');
        tabButton.id = `genlite-ui-tab-${icon}`;
        tabButton.style.width = '50px';
        tabButton.style.height = '50px';
        tabButton.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
        tabButton.style.borderBottom = '1px solid rgba(66, 66, 66, 1)';

        // If this is the first tab, set the border to none
        if (Object.keys(this.pluginTabs).length === 0) { 
            tabButton.style.borderTop = 'none';
        } else { 
            tabButton.style.borderTop = '1px solid rgba(0, 0, 0, 1)';
        }
        tabButton.style.cursor = 'pointer';
        tabButton.style.display = 'flex';
        tabButton.style.justifyContent = 'center';
        tabButton.style.alignItems = 'center';
        tabButton.innerHTML = `<i class="fas fa-${icon}"></i>`;
        tabButton.addEventListener('click', () => this.showTab(tabName));
        this.tabBar.appendChild(tabButton);

        if (!initiallyVisible) tabButton.style.display = 'none';

        // Add to plugin tabs object
        this.pluginTabs[tabName] = tabContent;
        return tabButton;
    }
        

    async showTab(tabName: string) {
        // Update the tab content header
        this.tabContentHeader.innerHTML = tabName;

        // Remove the current tab content
        this.tabContentHolder.innerHTML = '';

        // Re-add the tab content
        this.tabContentHolder.appendChild(this.pluginTabs[tabName]);
    }

    async registerPlugin(plugin: string, pluginStateHandler:any, settings: Object, pluginContext : Object) {
        // Add a Plugin Row
        const pluginRow = document.createElement('div');
        pluginRow.style.width = '100%';
        pluginRow.style.height = '25px';
        pluginRow.style.borderBottom = '1px solid rgba(66, 66, 66, 1)';

        // If this is not the first plugin, add a top border
        if (Object.keys(this.pluginSettings).length !== 0) {
            pluginRow.style.borderTop = '1px solid rgba(0, 0, 0, 1)';
        }

        pluginRow.style.display = 'flex';
        pluginRow.style.alignItems = 'center';

        // Add the Plugin Name
        const pluginName = document.createElement('div');
        pluginName.style.width = '100%';
        pluginName.style.height = '100%';
        pluginName.style.display = 'flex';
        pluginName.style.justifyContent = 'flex-start';
        pluginName.style.alignItems = 'center';
        pluginName.style.paddingLeft = '10px';
        pluginName.innerHTML = plugin;
        pluginRow.appendChild(pluginName);

        // The pluginCog and pluginCheckbox need to be grouped together and on the far-right of the plugin label
        const pluginCogAndCheckbox = document.createElement('div');
        pluginCogAndCheckbox.style.height = '100%';
        pluginCogAndCheckbox.style.display = 'flex';
        pluginCogAndCheckbox.style.justifyContent = 'flex-end';
        pluginCogAndCheckbox.style.alignItems = 'center';
        pluginCogAndCheckbox.style.paddingRight = '5px';
        pluginRow.appendChild(pluginCogAndCheckbox);
        
        const pluginCog = document.createElement('i');
        pluginCog.classList.add('fas');
        pluginCog.classList.add('fa-cog');
        pluginCog.style.marginLeft = '5px';
        pluginCog.style.cursor = 'pointer';
        pluginCog.addEventListener('click', () => {
            // If the settings tab is already open, close it
            this.tabContentHolder.innerHTML = '';

            this.tabContentHeader.innerHTML = plugin;

            // Add the settings div to the tab content holder
            this.tabContentHolder.appendChild(this.pluginSettings[plugin]);
        });
        pluginCogAndCheckbox.appendChild(pluginCog);

        // Create the Enable/Disable Checkbox
        const pluginCheckbox = document.createElement('input');
        pluginCheckbox.type = 'checkbox';
        pluginCheckbox.style.cursor = 'pointer';
        pluginCheckbox.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
        pluginCheckbox.style.border = '1px solid rgba(0, 0, 0, 1)';
        pluginCheckbox.style.borderLeft = 'none';
        pluginCheckbox.style.borderBottom = 'none';
        pluginCheckbox.style.borderRadius = '0px 0px 0px 5px';

        // Add the event listener to the input
        pluginCheckbox.addEventListener('change', () => {
            // Call the plugin state handler
            pluginStateHandler.call(pluginContext, pluginCheckbox.checked);
        });


        // Add the checkbox to the label
        pluginCogAndCheckbox.appendChild(pluginCheckbox);

        this.settingsTab.appendChild(pluginRow);

 
        // Create the Settings HTML Div
        const pluginSettingsDiv = document.createElement('div');
        pluginSettingsDiv.id = `genlite-ui-plugin-${plugin}-settings`;

        // Create the back to plugin list button (a horizontal div that is the width of the side panel and is 50px tall)
        const backToPluginListButton = document.createElement('div');
        backToPluginListButton.style.position = 'absolute';
        backToPluginListButton.style.top = '0px';
        backToPluginListButton.style.left = '0px';
        backToPluginListButton.style.width = '100%';
        backToPluginListButton.style.height = '25px';
        backToPluginListButton.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
        backToPluginListButton.style.borderBottom = '1px solid rgba(0, 0, 0, 1)';
        backToPluginListButton.style.cursor = 'pointer';
        backToPluginListButton.style.display = 'flex';
        backToPluginListButton.style.justifyContent = 'center';
        backToPluginListButton.style.alignItems = 'center';
        backToPluginListButton.innerHTML = `<i class="fas fa-arrow-left"></i> Back to Plugin List`;
        backToPluginListButton.addEventListener('click', () => {
            this.showTab('Plugins');
        });

        // Add the back to plugin list button to the plugin settings div
        pluginSettingsDiv.appendChild(backToPluginListButton);
                
        // Container for the plugin settings
        const pluginSettingsContainer = document.createElement('div');
        pluginSettingsContainer.style.position = 'absolute';
        pluginSettingsContainer.style.top = '26px';
        pluginSettingsContainer.style.left = '0px';
        pluginSettingsContainer.style.width = '100%';
        pluginSettingsContainer.style.height = 'calc(100% - 25px)';
        pluginSettingsContainer.style.overflowY = 'auto';
        pluginSettingsContainer.style.borderTop = '1px solid rgba(66, 66, 66, 1)';

        // If no settings, hide the cog
        if (Object.keys(settings).length === 0) {
            pluginCog.style.display = 'none';
        } else {
            // Parse the pluginSettings object and add the settings to the settings tab
            for (const setting in settings) {
                // Create a label for the setting
                const settingLabel = document.createElement('label');
                settingLabel.style.display = 'flex';
                settingLabel.style.alignItems = 'center';
                settingLabel.style.margin = '5px';

                // Create the setting input (based off the type, this changes)
                let settingInput;
                // TODO: Add Slider support
                switch (settings[setting].type) {
                    case 'checkbox':
                        // Create the checkbox
                        settingInput = document.createElement('input');
                        settingInput.type = settings[setting].type;
                        settingInput.checked = settings[setting].value;
                        // Add the event listener to the input
                        settingInput.addEventListener('change', () => {
                            // Call the plugin state handler
                            settings[setting].stateHandler.call(pluginContext, settingInput.checked);
                        });

                        break;
                    case 'dropdown':
                        // Create the dropdown
                        settingInput = document.createElement('select');
                        for (const option of settings[setting].options) {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.value;
                            optionElement.innerHTML = option.label;
                            settingInput.appendChild(optionElement);
                        }
                        settingInput.value = settings[setting].value;
                        // Add the event listener to the input
                        settingInput.addEventListener('change', () => {
                            // Call the plugin state handler
                            
                            settings[setting].stateHandler.call(pluginContext, settingInput.value);
                        });
                        break;
                    default:
                        // Create the input
                        settingInput = document.createElement('input');
                        settingInput.type = settings[setting].type;
                        settingInput.value = settings[setting].value;
                        // Add the event listener to the input
                        settingInput.addEventListener('change', () => {
                            // Call the plugin state handler
                            settings[setting].stateHandler.call(pluginContext, settingInput.value);
                        });
                        break;
                }
                // Add the setting input to the label
                settingLabel.innerHTML = `${settings[setting].label}: `;
                settingLabel.appendChild(settingInput);

                // Add the setting label to the settings div
                pluginSettingsContainer.appendChild(settingLabel);
            }
        }

        // Add the settings container to the settings div
        pluginSettingsDiv.appendChild(pluginSettingsContainer);

        // Add the settings div to this.pluginSettings
        this.pluginSettings[plugin] = pluginSettingsDiv;
    };

};
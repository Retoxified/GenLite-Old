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

    // Read Only Public Property
    private _hasInitialized: boolean = false;
    public get hasInitialized(): boolean {
        return this._hasInitialized;
    }


    private sidePanel: HTMLElement;
    private tabBar: HTMLElement;
    private tabContentHeader: HTMLElement;
    private tabContentHolder: HTMLElement;
    private settingsTab: HTMLElement;
    private alertHolder: HTMLElement;

    private pluginTabs = {};
    private pluginSettings: Map<string, HTMLElement> = new Map<string, HTMLElement>();



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

        // Alert Holder
        this.alertHolder = document.createElement('div');
        this.alertHolder.id = 'genlite-ui-alert-holder';
        this.alertHolder.style.position = 'absolute';
        this.alertHolder.style.top = '51px';
        this.alertHolder.style.right = '51px';
        this.alertHolder.style.width = 'calc(100% - 50px)';
        this.alertHolder.style.height = 'calc(100% - 50px)';
        this.alertHolder.style.backgroundColor = 'rgba(20, 20, 20, 0.90)';
        this.alertHolder.style.borderTop = '1px solid rgba(0, 0, 0, 1)';
        this.alertHolder.style.borderRight = '1px solid rgba(66, 66, 66, 1)';
        this.alertHolder.style.display = 'none';
        this.sidePanel.appendChild(this.alertHolder);


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

    async postInit() {
        this._hasInitialized = true;
    }

    handlePluginState(state: boolean): void {
        // TODO: Implement
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

    showAlert(message: string, confirmCallback: Function, cancelCallback: Function) {
        // This adds a message to the alert holder and displays it

        const currentHeader = this.tabContentHeader.innerHTML;
        this.tabContentHeader.innerHTML = "Warning";
        // Blur the tab content holder
        this.tabContentHolder.style.filter = 'blur(3px)';

        // Clear the alert holder
        this.alertHolder.innerHTML = '';

        // Create the alert message
        const alertMessage = document.createElement('div');
        alertMessage.style.width = '100%';
        alertMessage.style.height = '100%';
        alertMessage.style.display = 'flex';
        alertMessage.style.justifyContent = 'center';
        alertMessage.style.alignItems = 'center';
        alertMessage.style.color = 'white';
        alertMessage.style.fontSize = '20px';
        alertMessage.innerHTML = message;
        alertMessage.style.padding = '10px';
        this.alertHolder.appendChild(alertMessage);

        // Create the confirm button
        const confirmButton = document.createElement('div');
        confirmButton.style.position = 'absolute';
        confirmButton.style.bottom = '10px';
        confirmButton.style.right = '10px';
        confirmButton.style.width = '100px';
        confirmButton.style.height = '30px';
        confirmButton.style.backgroundColor = 'rgba(0, 255, 0, 0.75)';
        confirmButton.style.border = '1px solid rgba(66, 66, 66, 1)';
        confirmButton.style.borderRadius = '5px';
        confirmButton.style.cursor = 'pointer';
        confirmButton.style.display = 'flex';
        confirmButton.style.justifyContent = 'center';
        confirmButton.style.alignItems = 'center';
        confirmButton.style.color = 'white';
        confirmButton.style.fontSize = '20px';
        confirmButton.innerHTML = 'Confirm';
        confirmButton.addEventListener('click', () => {
            this.alertHolder.style.display = 'none';
            this.tabContentHolder.style.filter = 'none';
            this.tabContentHeader.innerHTML = currentHeader;
            confirmCallback();
        });

        // Create the cancel button
        const cancelButton = document.createElement('div');
        cancelButton.style.position = 'absolute';
        cancelButton.style.bottom = '10px';
        cancelButton.style.left = '10px';
        cancelButton.style.width = '100px';
        cancelButton.style.height = '30px';
        cancelButton.style.backgroundColor = 'rgba(255, 0, 0, 0.75)';
        cancelButton.style.border = '1px solid rgba(66, 66, 66, 1)';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.display = 'flex';
        cancelButton.style.justifyContent = 'center';
        cancelButton.style.alignItems = 'center';
        cancelButton.style.color = 'white';
        cancelButton.style.fontSize = '20px';
        cancelButton.innerHTML = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.alertHolder.style.display = 'none';
            this.tabContentHolder.style.filter = 'none';
            this.tabContentHeader.innerHTML = currentHeader;
            cancelCallback();
        });

        // Add the buttons to the alert holder
        this.alertHolder.appendChild(confirmButton);
        this.alertHolder.appendChild(cancelButton);

        // Display the alert holder
        this.alertHolder.style.display = 'flex';
    }


    showTab(tabName: string) {
        // Update the tab content header
        this.tabContentHeader.innerHTML = tabName;

        // Remove the current tab content
        this.tabContentHolder.innerHTML = '';

        // Re-add the tab content
        this.tabContentHolder.appendChild(this.pluginTabs[tabName]);
    }

    registerPlugin(plugin: string, oldKey: string, pluginStateHandler: Function, settings: Settings = {}, enableAlert: boolean = false, alertMessage: string = '') {
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

        // Create the Enable/Disable Checkbox
        const pluginCheckbox = document.createElement('input');
        pluginCheckbox.type = 'checkbox';
        pluginCheckbox.style.cursor = 'pointer';
        pluginCheckbox.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
        pluginCheckbox.style.border = '1px solid rgba(0, 0, 0, 1)';
        pluginCheckbox.style.borderLeft = 'none';
        pluginCheckbox.style.borderBottom = 'none';
        pluginCheckbox.style.borderRadius = '0px 0px 0px 5px';

        // Add the event listener to the input (this could be refactored to be prettier)
        pluginCheckbox.addEventListener('change', () => {
            // Call the plugin state handler
            if (enableAlert) {
                if (pluginCheckbox.checked) {
                    this.showAlert(alertMessage, () => {
                        pluginStateHandler(pluginCheckbox.checked);
                    }, () => {
                        pluginCheckbox.checked = false;
                    });
                } else {
                    pluginStateHandler(pluginCheckbox.checked);
                }
            } else {
                pluginStateHandler(pluginCheckbox.checked);
            }

            if (pluginCheckbox.checked) {
                // Set cog to enabled
                pluginCog.style.color = 'rgba(255, 255, 255, 1)';
                pluginCog.style.cursor = 'pointer';
            } else {
                // Set cog to disabled
                pluginCog.style.color = 'rgba(255, 255, 255, 0.5)';
                pluginCog.style.cursor = 'default';
            }

            this.setKey(plugin, pluginCheckbox.checked);

        });

        const pluginCog = document.createElement('i');
        pluginCog.classList.add('fas');
        pluginCog.classList.add('fa-cog');
        pluginCog.style.marginLeft = '5px';
        pluginCog.style.cursor = 'pointer';
        pluginCog.addEventListener('click', () => {
            // if the plugin is disabled, don't open the settings tab
            if (!pluginCheckbox.checked) {
                return;
            }

            // If the settings tab is already open, close it
            this.tabContentHolder.innerHTML = '';

            this.tabContentHeader.innerHTML = plugin;

            // Add the settings div to the tab content holder
            this.tabContentHolder.appendChild(this.pluginSettings[plugin]);
        });


        // Add the checkbox and cog to the pluginCogAndCheckbox div
        pluginCogAndCheckbox.appendChild(pluginCog);
        pluginCogAndCheckbox.appendChild(pluginCheckbox);


        // Store the Plugin Name and State into Local Storage // MYQUICKREFTAG
        // Determine if there is an old key
        if (oldKey !== '') {
            // Get the old key
            const oldKeyState = this.getKeyRaw(oldKey);

            if (oldKeyState !== null || oldKeyState !== undefined) {
                // Set the new key
                this.setKey(plugin, oldKeyState);
            }
        };
        let pluginState = this.getKey(plugin, false);

        // Convert plugin state to boolean
        pluginState = (pluginState === 'true') as boolean;

        // Set the checkbox state
        pluginCheckbox.checked = pluginState;

        // Call the plugin state handler
        pluginStateHandler(pluginState);

        // We have to update the cog color here because the plugin state handler may have changed the plugin state
        if (pluginState) {
            // Set cog to enabled
            pluginCog.style.color = 'rgba(255, 255, 255, 1)';
            pluginCog.style.cursor = 'pointer';
        } else {
            // Set cog to disabled
            pluginCog.style.color = 'rgba(255, 255, 255, 0.5)';

            // Disable pointer cursor
            pluginCog.style.cursor = 'default';
        }


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
            // Parse and add the settings for the plugin
            this.addSettings(plugin, pluginSettingsContainer, settings);
        }

        // Add the settings container to the settings div
        pluginSettingsDiv.appendChild(pluginSettingsContainer);

        // Add the settings div to this.pluginSettings
        this.pluginSettings[plugin] = pluginSettingsDiv;
    };

    // Add Settings
    addSettings(plugin: string, pluginSettingsContainer: HTMLDivElement, settings: Settings, parent = null) {
        // Parse the pluginSettings object and add the settings to the settings tab
        for (const setting in settings) {
            // Add a Settings Row
            const settingsRow = document.createElement('div');
            settingsRow.style.width = '100%';
            settingsRow.style.height = '25px';
            settingsRow.style.flexDirection = 'row';
            settingsRow.style.borderBottom = '1px solid rgba(66, 66, 66, 1)';

            // If this is the first setting, do not add a top border
            if (setting !== Object.keys(settings)[0]) {
                settingsRow.style.borderTop = '1px solid rgba(0, 0, 0, 1)';
            }

            settingsRow.style.display = 'flex';
            settingsRow.style.alignItems = 'center';

            // Add the Setting Name
            const settingName = document.createElement('div');
            settingName.style.width = '100%';
            settingName.style.height = '100%';
            settingName.style.display = 'flex';
            settingName.style.justifyContent = 'flex-start';
            settingName.style.alignItems = 'center';
            settingName.style.paddingLeft = '10px';
            settingName.innerHTML = setting;
            settingsRow.appendChild(settingName);

            const defaultValue = settings[setting].value;

            // The setting value is managed by getKey(), this function will return the value of the setting if it exists, otherwise it will create the setting and then return the default value (the value passed to the function)

            // If the setting has an oldKey, we need to migrate the setting
            if (settings[setting].oldKey) {
                // Get the old key
                const oldKey = settings[setting].oldKey;

                // Get the old key value
                const oldKeyValue = this.getKeyRaw(oldKey);

                // Set the new key value to the old key value
                this.setKey(plugin + "." + setting, oldKeyValue);
            }

            settings[setting].value = this.getKey(plugin + "." + setting, defaultValue);

            // Get the setting value in its correct type
            switch (settings[setting].type) {
                case 'checkbox':
                    settings[setting].value = settings[setting].value === 'true' ? true : false;
                    break;
                case 'number':
                    settings[setting].value = parseInt(settings[setting].value);
                    break;
                case 'text':
                    settings[setting].value = settings[setting].value.toString();
                    break;
                case 'select':
                    settings[setting].value = settings[setting].value.toString();
                    break;
                case 'color':
                    settings[setting].value = settings[setting].value.toString();
                    break;
                case 'range':
                    settings[setting].value = parseInt(settings[setting].value);
                    break;
                default:
                    console.error(`Invalid setting type for ${setting} in ${plugin}`);
                    break;
            }

            // Call the state handler for the setting
            settings[setting].stateHandler(settings[setting].value);

            // Create the setting input (based off the type, this changes)
            let settingInput;
            switch (settings[setting].type) {
                case 'checkbox':
                    // Create the checkbox
                    settingInput = document.createElement('input');
                    settingInput.style.cursor = 'pointer';
                    settingInput.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
                    settingInput.style.border = '1px solid rgba(0, 0, 0, 1)';
                    settingInput.style.borderLeft = 'none';
                    settingInput.style.borderBottom = 'none';
                    settingInput.style.borderRadius = '0px 0px 0px 5px';
                    settingInput.type = settings[setting].type;
                    settingInput.checked = settings[setting].value as boolean;

                    // Add the event listener to the input
                    // If the setting has an alert, then add a different event listener
                    if (settings[setting].alert !== undefined) {
                        settingInput.addEventListener('change', () => {
                            // Call the plugin state handler
                            if (settingInput.checked) {
                                this.showAlert(settings[setting].alert, () => {
                                    settings[setting].stateHandler(settingInput.checked);
                                }, () => {
                                    settingInput.checked = false;
                                });
                            } else {
                                settings[setting].stateHandler(settingInput.checked);
                            }
                        });
                    } else {
                        settingInput.addEventListener('change', () => {
                            // Call the plugin state handler
                            settings[setting].stateHandler(settingInput.checked);
                        });
                    }

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
                    settingInput.style.cursor = 'pointer';
                    settingInput.style.backgroundColor = 'rgba(42, 40, 40, 0.75)';
                    settingInput.style.border = '1px solid rgba(0, 0, 0, 1)';
                    settingInput.style.borderLeft = 'none';
                    settingInput.style.borderBottom = 'none';
                    settingInput.style.borderRadius = '0px 0px 0px 5px';
                    // Add the event listener to the input
                    settingInput.addEventListener('change', () => {
                        // Call the plugin state handler

                        settings[setting].stateHandler(settingInput.value);
                    });
                    break;
                case 'range':
                    // Create the slider (range input), this needs to exist on a separate line because of the way the slider works
                    let sliderRow = document.createElement('div');
                    sliderRow.style.height = '25px';
                    sliderRow.style.flexDirection = 'row';
                    sliderRow.style.display = 'flex';
                    sliderRow.style.alignItems = 'center';
                    sliderRow.style.justifyContent = 'space-between';
                    sliderRow.style.paddingLeft = '10px';
                    sliderRow.style.justifyContent = 'flex-start';
                    settingsRow.appendChild(sliderRow);


                    // Create the slider
                    settingInput = document.createElement('input');
                    settingInput.type = 'range';
                    settingInput.min = settings[setting].min;
                    settingInput.max = settings[setting].max;
                    settingInput.value = settings[setting].value as Number;
                    settingInput.style.width = '80%';

                    // If there is a parent, we need to add an event listener to the parent to hide/show the setting when the parent is toggled
                    if (parent !== null) {
                        parent.addEventListener('change', () => {
                            // Verify that the plugin is a checkbox
                            if (parent.type === 'checkbox') {
                                // If the plugin is checked, show the setting
                                if (parent.checked) {
                                    sliderRow.style.display = 'flex';
                                    settingsRow.style.display = 'flex';
                                } else {
                                    sliderRow.style.display = 'none';
                                    settingsRow.style.display = 'none';
                                }
                            }
                        });

                        if (parent.checked) {
                            sliderRow.style.display = 'flex';
                            settingsRow.style.display = 'flex';
                        } else {
                            sliderRow.style.display = 'none';
                            settingsRow.style.display = 'none';
                        }
                    }

                    // Add the event listener to the input
                    settingInput.addEventListener('change', () => {
                        // Call the plugin state handler
                        settings[setting].stateHandler(settingInput.value);
                        valueLabel.innerHTML = settingInput.value;

                        this.setKey(plugin + "." + setting, settingInput.value);
                    });

                    sliderRow.appendChild(settingInput);

                    // Remove bottom border from settings row
                    settingsRow.style.borderBottom = 'none';

                    // Apply the bottom border to the slider row
                    sliderRow.style.borderBottom = '1px solid rgba(66, 66, 66, 1)';

                    // Center the label
                    settingsRow.style.justifyContent = 'center';

                    // Add a value label to the sliderRow   
                    let valueLabel = document.createElement('label');
                    valueLabel.style.width = '20%';
                    valueLabel.style.textAlign = 'right';
                    valueLabel.style.paddingRight = '10px';
                    valueLabel.innerHTML = settingInput.value;
                    sliderRow.appendChild(valueLabel);



                    pluginSettingsContainer.appendChild(settingsRow);
                    pluginSettingsContainer.appendChild(sliderRow);
                    break;
                case 'color':
                    // Create the color picker
                    settingInput = document.createElement('input');
                    settingInput.type = 'color';
                    settingInput.value = settings[setting].value;
                    // Add the event listener to the input
                    settingInput.addEventListener('change', () => {
                        // Call the plugin state handler
                        settings[setting].stateHandler(settingInput.value);
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
                        settings[setting].stateHandler(settingInput.value);
                    });
                    break;
            }


            // The range input is a special case, so we handle it in a different way, so here we do nothing if it is a range
            if (settings[setting].type === 'range') {
                continue;
            }

            // If there is a parent, we need to add an event listener to the parent to hide/show the setting when the parent is toggled
            if (parent !== null) {
                parent.addEventListener('change', () => {
                    // Verify that the plugin is a checkbox
                    if (parent.type === 'checkbox') {
                        // If the plugin is checked, show the setting
                        if (parent.checked) {
                            settingsRow.style.display = 'flex';
                        } else {
                            settingsRow.style.display = 'none';
                        }
                    }
                });

                if (parent.checked) {
                    settingsRow.style.display = 'flex';
                } else {
                    settingsRow.style.display = 'none';
                }
            }

            // Add an additional event listener for the input to save the setting to local storage
            settingInput.addEventListener('change', () => {
                // Save the setting to local storage
                settingInput.type === 'checkbox' ? this.setKey(plugin + "." + setting, settingInput.checked) : this.setKey(plugin + "." + setting, settingInput.value);
            });

            // Add the setting input to the label
            settingsRow.appendChild(settingInput);


            // Add the setting label to the settings div
            pluginSettingsContainer.appendChild(settingsRow);

            // If the setting has children, call the function again
            if (settings[setting].children !== undefined) {
                this.addSettings(plugin, pluginSettingsContainer, settings[setting].children, settingInput);
            }
        }
    }


    // Local Storage Functions
    getKey(setting: string, defaultValue: any) {
        // Remove all Spaces from the setting
        setting = setting.replace(/\s/g, '');

        // Camel Case the setting
        setting = setting.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index == 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');

        // Check if setting exists in local storage
        let keyValue: string | number | boolean = localStorage.getItem("GenLite." + setting);

        // If it doesn't exist, set it to the default value
        if (keyValue === null || keyValue === undefined) {
            if (typeof defaultValue === 'boolean') {
                defaultValue = defaultValue ? 'true' : 'false';
            }

            localStorage.setItem("GenLite." + setting, defaultValue);
            keyValue = defaultValue;
        }

        return keyValue;
    }

    getKeyRaw(key: string) {
        return localStorage.getItem(key);
    }

    setKey(setting: string, value: any) {
        // Remove all Spaces from the setting
        setting = setting.replace(/\s/g, '');

        // Camel Case the setting
        setting = setting.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index == 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');

        // Set the setting in local storage
        localStorage.setItem("GenLite." + setting, value);
    }
};
/*
    Copyright (C) 2023 KKonaOG dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLiteConfirmation } from "../helpers/genlite-confirmation.class";
import { GenLitePlugin } from "../interfaces/plugin.class";

export class GenLiteSettingsPlugin extends GenLitePlugin {
    public static pluginName = 'GenLiteSettingsPlugin';
    private settings: { [key: string]: { value: any, DOM: HTMLElement } } = {};
    private container: HTMLElement;

    async init() {
        // Create a container element for genlite settings
        this.container = document.createElement("div");
        this.container.id = "new_ux-settings-modal__settings-box-1";
        this.container.className = "new_ux-settings-modal__settings-box";

        let headerElement = document.createElement("div");
        headerElement.className = "new_ux-settings-modal__settings-row new_ux-settings-modal__settings-row--title";

        let headerText = document.createElement("span");
        headerText.className = "new_ux-settings-modal__setting-row-title__title-text";
        headerText.innerText = "GenLite";

        headerElement.appendChild(headerText);
        this.container.appendChild(headerElement);

        //add a search box for settings
        let searchBox = document.createElement("input");
        searchBox.type = "text";
        searchBox.onkeyup = (event) => { this.searchSettings.call(this, event) };
        searchBox.onfocus = () => { document.game.CHAT.focus_locked = true; }
        searchBox.onblur = () => { document.game.CHAT.focus_locked = false; }
        searchBox.placeholder = "Settings Search";
        searchBox.id = "GenliteSettingsSearch";
        this.container.appendChild(searchBox);

        // Add GenLite settings to the modal
        let settingsModal = document.getElementById("new_ux-settings-modal__inner-space");
        settingsModal.appendChild(this.container);
    }

    handlePluginState(state: boolean): void {
        // TODO: Implement
    }

    /* goes through and disables child settings if needed */
    async postInit() {
        for (let key in this.settings) {
            let setting = this.settings[key];
            if (setting.value)
                continue;
            //disable child elements
            let children = document.getElementsByClassName(key);
            for (let i = 0; i < children.length; i++) {
                let element = <HTMLElement>children[i];
                element.style.opacity = setting.value ? "1" : "0.6";
                let elementInput = <HTMLInputElement>element.children[1]
                elementInput.disabled = !setting.value;
            }

        }

    }

    public add(key: string, defaultValue: any, label: string, inputType: string, callback: (value: any) => void, context: any, confirmationMessage: string = undefined, attributeList = undefined, parent = undefined): any {
        // Set the default value for the setting if it has not been set already
        if (!(key in this.settings)) {
            this.settings[key] = { value: undefined, DOM: undefined };

            let localStorageKey = "GenLite." + key;
            const storedValue = localStorage.getItem(localStorageKey);
            if (storedValue) {
                if (inputType === "checkbox") {
                    this.settings[key].value = (storedValue === "true" ? true : false); // localStorage is always a string, so we need to compare to "true"
                } else {
                    this.settings[key].value = storedValue;
                }

            } else {
                this.settings[key].value = defaultValue;
            }
        }

        // Create an input element for the setting
        const input = document.createElement('input');
        input.type = inputType;
        for (let i in attributeList) {
            let attr = attributeList[i]
            input.setAttribute(attr[0], attr[1]);
        }
        if (inputType === "checkbox") {
            input.checked = this.settings[key].value;
        } else {
            input.value = this.settings[key].value;
        }

        input.onchange = async (event) => {
            // Update the setting value when the input value changes
            if (inputType === "checkbox") {
                if (input.checked === true && confirmationMessage !== undefined) {
                    if (await GenLiteConfirmation.confirm(confirmationMessage) === false) {
                        input.checked = false;
                        event.preventDefault();
                        return;
                    }
                }

                this.settings[key].value = input.checked;
            } else {
                this.settings[key].value = input.value;
            }

            // Save the setting to local storage
            localStorage.setItem("GenLite." + key, this.settings[key].value);

            // Call the callback function with the new value
            callback.call(context, this.settings[key].value);

            //disable child elements
            let children = document.getElementsByClassName(key);
            for (let i = 0; i < children.length; i++) {
                let element = <HTMLElement>children[i];
                element.style.opacity = input.checked ? "1" : "0.6";
                let elementInput = <HTMLInputElement>element.children[1]
                elementInput.disabled = !input.checked;
            }

        };

        // Add the label and input element to the container
        const settingContainer = document.createElement('div');
        const labelElement = document.createElement('label');

        settingContainer.className = "new_ux-settings-modal__settings-row";
        settingContainer.classList.add(context.constructor.pluginName);
        if (parent)
            settingContainer.classList.add(parent);
        labelElement.className = "new_ux-settings-modal__setting-name";
        labelElement.innerHTML = label;

        settingContainer.appendChild(labelElement);
        settingContainer.appendChild(input);
        this.container.appendChild(settingContainer);

        this.settings[key].DOM = settingContainer;
        return this.settings[key].value;
    }

    searchSettings(event) {
        let input = <HTMLInputElement>document.getElementById("GenliteSettingsSearch");
        let filter = input.value.toUpperCase();
        for (let i = 0; i < this.container.children.length; i++) {
            let setting = <HTMLElement>this.container.children[i];
            if (!setting.classList.contains("new_ux-settings-modal__settings-row"))
                continue;
            let text = setting.innerText;
            if (text.toUpperCase().indexOf(filter) > -1 ||
                setting.classList[1].toString().toUpperCase().indexOf(filter) > -1) {
                setting.style.display = "";
            } else {
                setting.style.display = "none";
            }
        }
    }

    /* in case you want to programatically toggle a setting */
    toggle(key, value: boolean) {
        if (value) {
            (<HTMLInputElement>this.settings[key].DOM.children[1]).checked = value
        } else {
            (<HTMLInputElement>this.settings[key].DOM.children[1]).checked = !(<HTMLInputElement>this.settings[key].DOM.children[1]).checked
        }
        (<HTMLInputElement>this.settings[key].DOM.children[1]).onchange(null);
    }
}

import { GenliteConfirmation } from "../helpers/genlite-confirmation.class";

export class GenLiteSettingsPlugin {
    public static pluginName = 'GenLiteSettingsPlugin';
    private settings: {[key: string]: any} = {};
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

        // Add GenLite settings to the modal
        let settingsModal = document.getElementById("new_ux-settings-modal__inner-space");
        settingsModal.appendChild(this.container);
    }

    public add(key: string, defaultValue: any, label: string, inputType: string, callback: (value: any) => void, context: any, confirmationMessage: string = undefined): any {
        // Set the default value for the setting if it has not been set already
        if (!(key in this.settings)) {

            let localStorageKey = "GenLite." + key;
            const storedValue = localStorage.getItem(localStorageKey);
            if (storedValue) {
                if(inputType === "checkbox") {
                    this.settings[key] = (storedValue === "true" ? true : false); // localStorage is always a string, so we need to compare to "true"
                } else {
                    this.settings[key] = storedValue;
                }

            } else {
                this.settings[key] = defaultValue;
            }
        }

        // Create an input element for the setting
        const input = document.createElement('input');
        input.type = inputType;
        if(inputType === "checkbox") {
            input.checked = this.settings[key];
        } else {
            input.value = this.settings[key];
        }

        input.addEventListener('change', async(event) => {
            // Update the setting value when the input value changes
            if(inputType === "checkbox") {
                if(input.checked === true && confirmationMessage !== undefined) {
                    if(await GenliteConfirmation.confirm(confirmationMessage) === false) {
                        input.checked = false;
                        event.preventDefault();
                        return;
                    }
                }

                this.settings[key] = input.checked;
            } else {
                this.settings[key] = input.value;
            }

            // Save the setting to local storage
            localStorage.setItem("GenLite." + key, this.settings[key]);

            // Call the callback function with the new value
            callback.call(context, this.settings[key]);
        });

        // Add the label and input element to the container
        const settingContainer = document.createElement('div');
        const labelElement = document.createElement('label');

        settingContainer.className = "new_ux-settings-modal__settings-row";
        labelElement.className = "new_ux-settings-modal__setting-name";
        labelElement.textContent = label;

        settingContainer.appendChild(labelElement);
        settingContainer.appendChild(input);
        this.container.appendChild(settingContainer);

        return this.settings[key];
    }
}
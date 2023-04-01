/*
    Copyright (C) 2022-2023 KKonaOG 
*/
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

// This plugin is designed to insert an HTML element into the game's UI that displays the current version of GenLite next to the Client Version

// Import Plugin Interface
import {GenLitePlugin} from '../core/interfaces/plugin.interface';

// Require the package.json file
const packageJson = require('../../package.json');

// Create Version Plugin Class
export class GenLiteVersionPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteVersionPlugin';

    // Plugin Data
    version: string = packageJson.version;

    // Plugin UI
    versionContainer: HTMLParagraphElement;

    // Plugin Hooks
    async init() {
        document.genlite.registerPlugin(this);

        // Create and Append the Version Container to the Body
        this.versionContainer = document.createElement('p');
        this.versionContainer.innerText = `GenLite Version: ${this.version}`;
        this.versionContainer.className = 'version-container';

        // Makes it appear as as a new line
        this.versionContainer.style.padding = '0';
        this.versionContainer.style.margin = '0';

        
        // Need more padding to prevent spill off the screen
        document.body.querySelector('#loginversion').parentElement.style.padding = '1.2rem' // Override the Login Version Span's Default Padding (0.2 rem)

        // Append the Version Paragraph to the Login Version Span
        document.body.querySelector('#loginversion').appendChild(this.versionContainer);
    }

    handlePluginState(state: boolean): void {
        // TODO: Implement
        // Display Yellow Console Message Stating the plugin needs to implement this
        console.log(`%c[GenLite] %c${this.constructor.name} %cneeds to implement handlePluginState()`, "color: #ff0", "color: #fff", "color: #f00");
    }
}

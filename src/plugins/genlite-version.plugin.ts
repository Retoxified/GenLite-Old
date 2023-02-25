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
        window.genlite.registerPlugin(this);

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
}

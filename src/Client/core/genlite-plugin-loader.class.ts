/*
    Copyright (C) 2022-2023 Retoxified, FrozenReality
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { ExamplePlugin } from "./help/example-plugin.class";
import { GenLitePlugin } from './interfaces/plugin.class';



export class GenLitePluginLoader {
    plugins;

    constructor() {
        this.plugins = [];
    }

    /**
     * Instantiates an instance of pluginClass,
     * Runs its async init() function
     * Adds a document field for the instance matching pluginClass.name
     * The plugin instance will then also appear in this.plugins[]
     * @param pluginClass
     * @returns {Promise<boolean>}
     */
    async addPlugin<T extends GenLitePlugin>(pluginClass): Promise<T> {
        try {
            this.verifyPluginClassStructure(pluginClass);
        } catch (e) {
            console.error('[GenLitePluginLoader]: Error loading plugin:', e);
            console.error('[GenLitePluginLoader]: Plugin classes need to follow the given example structure', this.getExampleStructure());
            return undefined;
        }

        try {
            const pluginInstance = new pluginClass();
            await pluginInstance.init();

            document[pluginClass.pluginName] = pluginInstance;

            this.plugins.push(pluginInstance);
            console.log(`[GenLitePluginLoader]: Loaded plugin ${pluginClass.pluginName}`);
            return pluginInstance;
        } catch (e) {
            console.error(`[GenLitePluginLoader]: Error initialising plugin ${pluginClass.pluginName}`, e);
        }
    }

    async postInit() {
        for (const plugin of this.plugins) {
            // If the plugin has a postInit function, run it
            if (plugin.postInit) {
                plugin.postInit();
            }
        }
    }


    /**
     * Throws errors if pluginClass is missing specific fields, such as init
     * @param pluginClass
     */
    verifyPluginClassStructure(pluginClass) {
        if (!pluginClass.prototype.init) {
            throw new Error(`Plugin class ${pluginClass} does not define an init function.`);
        }

        if (typeof (pluginClass.prototype.init) !== 'function') {
            throw new Error(`Plugin class ${pluginClass}.init was not defined as a function`);
        }

        if (!pluginClass.pluginName) {
            throw new Error(`Plugin class ${pluginClass} does not define a pluginName`);
        }

        if (!pluginClass.prototype.handlePluginState) {
            throw new Error(`Plugin class ${pluginClass} does not define a handlePluginState function.`);
        }

        if (typeof (pluginClass.prototype.handlePluginState) !== 'function') {
            throw new Error(`Plugin class ${pluginClass}.handlePluginState was not defined as a function`);
        }
    }

    getExampleStructure() {
        return ExamplePlugin;
    }
}

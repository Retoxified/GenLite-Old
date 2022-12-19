import { ExamplePlugin } from "./help/example-plugin";

export class GenLitePluginLoader {
    plugins;

    constructor() {
        this.plugins  = [];
    }

    /**
     * Instantiates an instance of pluginClass,
     * Runs its async init() function
     * Adds a window field for the instance matching pluginClass.name
     * The plugin instance will then also appear in this.plugins[]
     * @param pluginClass
     * @returns {Promise<boolean>}
     */
    async addPlugin(pluginClass) {
        try {
            this.verifyPluginClassStructure(pluginClass);
        } catch (e) {
            console.error('[GenLitePluginLoader]: Error loading plugin:', e);
            console.error('[GenLitePluginLoader]: Plugin classes need to follow the given example structure', this.getExampleStructure());
            return false;
        }

        const pluginInstance = new pluginClass();
        await pluginInstance.init();

        window[pluginClass.name] = pluginInstance;

        this.plugins.push(pluginInstance);
        console.log(`[GenLitePluginLoader]: Loaded plugin ${pluginClass}`);

        return true;
    }

    /**
     * Throws errors if pluginClass is missing specific fields, such as init
     * @param pluginClass
     */
    verifyPluginClassStructure(pluginClass) {
        if (!pluginClass.__proto__.init) {
            throw new Error(`Plugin class ${pluginClass} does not define an init function.`);
        }

        if (typeof(pluginClass.__proto__.init) !== 'function') {
            throw new Error(`Plugin class ${pluginClass}.init was not defined as a function`);
        }

        if (!pluginClass.__proto__.name) {
            throw new Error(`Plugin class ${pluginClass} does not define a name`);
        }
    }

    getExampleStructure() {
        return ExamplePlugin;
    }
}

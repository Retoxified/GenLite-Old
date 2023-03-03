import { GenLitePluginLoader } from "./genlite-plugin-loader.class";
import { GenLiteNotificationPlugin } from "./plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./plugins/genlite-settings.plugin";
import { GenLiteCommandsPlugin } from "./plugins/genlite-commands.plugin";
import { GenLiteUIPanel } from "../plugins/genlite-ui-panel";
import {GenLitePlugin} from './interfaces/plugin.interface';

export class GenLite {
    static pluginName = 'GenLite';

    pluginLoader: GenLitePluginLoader;

    pluginList = [];

    notifications: GenLiteNotificationPlugin;
    settings: GenLiteSettingsPlugin;
    commands: GenLiteCommandsPlugin;
    ui: GenLiteUIPanel;

    /** We allow setting "any field, to anything" in order to load core features such as genlite.notifications */
    [key: string]: any;

    constructor() {
        this.pluginLoader = new GenLitePluginLoader();
    }

    async init() {
        this.installHook(Camera.prototype, 'update');
        this.installHook(Network.prototype, 'logoutOK');
        this.installHook(PhasedLoadingManager.prototype, 'start_phase', this.hookPhased);
        this.installHook(Network.prototype, 'action');
        this.installHook(Network.prototype, 'handle');
        this.installHook(PlayerInfo.prototype, 'updateXP');
        this.installHook(PlayerInfo.prototype, 'updateTooltip');
        this.installHook(PlayerInfo.prototype, 'updateSkills');
        this.installHook(window, 'initializeUI');
        this.installHook(Game.prototype, 'combatUpdate');
        this.installHook(PlayerHUD.prototype, 'setHealth');
        this.installHook(Inventory.prototype, 'handleUpdatePacket');
    }

    hook(fnName: string, ...args: Array<unknown>) {
        for (const module of this.pluginList) {
            if (typeof module[fnName] === 'function') {
                try {
                    module[fnName].apply(module, args);
                } catch (e) {
                    console.error(`GenLite plugin ${module.constructor.pluginName} error in ${fnName}:`, e);
                }
            }
        }
    }

    hookPhased(fnName: string, ...args: Array<unknown>) {
        if (args[0] === "game_loaded") {
            this.hook('loginOK', args);
        }
    }

    registerPlugin(plugin: GenLitePlugin) {
        this.pluginList.push(plugin);
    }

    unregisterPlugin(plugin: GenLitePlugin) {
        const index = this.pluginList.indexOf(plugin);

        if (index !== -1) {
            this.pluginList.splice(index, 1);
        }
    }

    installHook(object: Object, functionName: string, hookFn = this.hook) {
        const self = this;

        (function (originalFunction) {
            object[functionName] = function (...args: Array<unknown>) {
                const returnValue = originalFunction.apply(this, arguments);

                hookFn.apply(self, [functionName, ...args]);

                return returnValue;
            };
        }(object[functionName]));
    }

    sendDataToServer(url, data) {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", `https://nextgensoftware.nl/${url}.php`);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(data));
    }
}

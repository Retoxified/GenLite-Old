/*
    Copyright (C) 2022-2023 Retoxified, FrozenReality, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePluginLoader } from "./genlite-plugin-loader.class";
import { GenLiteNotificationPlugin } from "./plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./plugins/genlite-settings.plugin";
import { GenLiteCommandsPlugin } from "./plugins/genlite-commands.plugin";
import { GenLiteDatabasePlugin } from "./plugins/genlite-database.plugin";
import { GenLiteUIPlugin } from "./plugins/genlite-ui-plugin";
import { GenLitePlugin} from './interfaces/plugin.interface';

export class GenLite {
    static pluginName = 'GenLite';

    pluginLoader: GenLitePluginLoader;

    pluginList = [];

    notifications: GenLiteNotificationPlugin;
    settings: GenLiteSettingsPlugin;
    commands: GenLiteCommandsPlugin;
    database: GenLiteDatabasePlugin;
    ui: GenLiteUIPlugin;

    /** We allow setting "any field, to anything" in order to load core features such as genlite.notifications */
    [key: string]: any;

    constructor() {
        this.pluginLoader = new GenLitePluginLoader();
    }

    async init() {
        this.installHook(document.game.Camera.prototype, 'update');
        this.installHook(document.game.Network.prototype, 'logoutOK');
        this.installHook(document.game.Network.prototype, 'disconnect', this.hookDisconnect)
        this.installHook(document.game.PhasedLoadingManager, 'start_phase', this.hookPhased);
        this.installHook(document.game.Network.prototype, 'action');
        this.installHook(document.game.Network.prototype, 'handle');
        this.installHook(document.game.PlayerInfo.prototype, 'updateXP');
        this.installHook(document.game.PlayerInfo.prototype, 'updateTooltip');
        this.installHook(document.game.PlayerInfo.prototype, 'updateSkills');
        // this no longer exists in genfanad: this.installHook(window, 'initializeUI');
        this.installHook(document.game.Game.prototype, 'combatUpdate');
        this.installHook(document.game.PlayerHUD.prototype, 'setHealth');
        this.installHook(document.game.Inventory.prototype, 'handleUpdatePacket');
        this.installHook(document.game.Bank.prototype, 'handlePacket');
        this.installHook(document.game.Bank.prototype, '_showQualityPopup');
        this.installHook(document.game.Trade.prototype, 'handlePacket', this.hookTrade_handlePacket);
        this.installHook(document.game.Bank.prototype, '_addContextOptionsActual')
        this.installHook(document.game.Bank.prototype, '_addContextOptions')
    
        // Enhanced Context Menu Hooks
        this.installHook(document.game.NPC.prototype, 'intersects', this.hookNPC_Intersects);
        this.installHook(document.game.OptimizedScene.prototype, 'intersects', this.hookOptimizedScene_Intersects);
        this.installHook(document.game.Inventory.prototype, '_getAllContextOptions', this.hookInventory_getAllContextOptions);

    }

    onUIInitialized() {
        this.hook('initializeUI');
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

            if (!this.ui.hasInitialized) {
                this.pluginLoader.postInit();
            }
        }
    }

    hookDisconnect(fnName: string, ...args: Array<unknown>) {
        this.hook('logoutOK', args);
    }

    /* because Bank and Trade have the same function name */
    hookTrade_handlePacket(fnName: string, ...args: Array<unknown>){
        this.hook('Trade_handlePacket', args)
    }

    // Intersect Hooks
    hookNPC_Intersects(fnName: string, ...args: Array<unknown>) {
        this.hook('NPC_Intersects', ...args);
    }

    hookOptimizedScene_Intersects(fnName: string, ...args: Array<unknown>) {
        this.hook('OptimizedScene_Intersects', ...args);
    }

    hookInventory_getAllContextOptions(fnName: string, ...args: Array<unknown>) {
        this.hook('Inventory_getAllContextOptions', ...args);
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

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
import { GenLitePlugin } from './interfaces/plugin.class';

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
        this.installHookNoProto('PhasedLoadingManager', 'start_phase', this.hookPhased);
        this.installHook('Network', 'logoutOK');
        this.installHook('Network', 'disconnect', this.hookDisconnect)
        this.installHook('Network', 'action');
        this.installHook('Network', 'handle');
        this.installHook('Camera', 'update');
        this.installHook('PlayerInfo', 'updateXP');
        this.installHook('PlayerInfo', 'updateTooltip');
        this.installHook('PlayerInfo', 'updateSkills');
        this.installHook('Game', 'combatUpdate');
        this.installHook('PlayerHUD', 'setHealth');
        this.installHook('Inventory', 'handleUpdatePacket');
        this.installHook('Inventory', '_getContextOptionsBank');
        this.installHook('Bank', 'handlePacket');
        this.installHook('Bank', '_showQualityPopup');
        this.installHook('Bank', '_addContextOptionsActual')
        this.installHook('Bank', '_addContextOptions')
        this.installHook('Trade', 'handlePacket');

        // Enhanced Context Menu Hooks
        this.installHook('NPC', 'intersects');
        this.installHook('OptimizedScene', 'intersects');
        this.installHook('Inventory', '_getAllContextOptions');

        this.installHook('Friends', 'getContextOptionsFriends');
        this.installHook('Friends', '_populateFriends');

    }

    onUIInitialized() {
        this.hook('initializeUI');
        this.hookInventoryContextMenu()
    }


    hook(fnName: string, ...args: Array<unknown>) {
        for (const module of this.pluginList) {
            if (typeof module[fnName] === 'function') {
                try {
                    module[fnName].apply(module, args);
                } catch (e) {
                    console.error(`GenLite plugin ${module.constructor.pluginName} error ${fnName}:`, e);
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
        this.hook('Network_logoutOK', args);
    }

    /* override the client's function referance after hooking */
    hookInventoryContextMenu() {
        let context_map = (<Inventory>document.game.INVENTORY).context_map;
        let invProto = document.game.Inventory.prototype;
        context_map.normal = invProto._getContextOptionsNormal;
        context_map.trade = invProto._getContextOptionsTrade;
        context_map.bank = invProto._getContextOptionsBank;
        context_map.crafting_slots = invProto._getContextOptionsCraftingSlots;
        context_map.shop = invProto._getContextOptionsShop;
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

    installHook(objectName: string, functionName: string, hookFn = this.hook) {
        const self = this;
        const object = document.game[objectName].prototype;
        const hookName = `${objectName}_${functionName}`;

        (function (originalFunction) {
            object[functionName] = function (...args: Array<unknown>) {
                const returnValue = originalFunction.apply(this, arguments);

                hookFn.apply(self, [hookName, ...args]);

                return returnValue;
            };
        }(object[functionName]));
    }

    installHookNoProto(objectName: string, functionName: string, hookFn = this.hook) {
        const self = this;
        const object = document.game[objectName];
        const hookName = `${objectName}_${functionName}`;

        (function (originalFunction) {
            object[functionName] = function (...args: Array<unknown>) {
                const returnValue = originalFunction.apply(this, arguments);

                hookFn.apply(self, [hookName, ...args]);

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
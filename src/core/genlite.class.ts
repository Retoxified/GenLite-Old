import { GenlitePluginLoader } from "./genlite-plugin-loader.class";
import { GenLiteNotificationPlugin } from "./plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./plugins/genlite-settings.plugin";

export class GenLite {
    static pluginName = 'GenLite';

    pluginLoader;

    moduleList = [];

    notifications: GenLiteNotificationPlugin;
    settings: GenLiteSettingsPlugin;

    /** We allow setting "any field, to anything" in order to load core features such as genlite.notifications */
    [key: string]: any;

    constructor() {
        this.pluginLoader = new GenlitePluginLoader();
    }

    async init() {
        this.installHook(Camera.prototype, 'update', this.hook_Camera_update, this);
        this.installHook(Network.prototype, 'logoutOK', this.hook_Network_logoutOK, this);
        this.installHook(PhasedLoadingManager.prototype, 'start_phase',  this.hook_PhasedLoadingManager_start_phase,  this);
        this.installHook(Network.prototype, 'action', this.hook_Network_action, this);
        this.installHook(Network.prototype, 'handle', this.hook_Network_handle, this);
        this.installHook(PlayerInfo.prototype, 'updateXP', this.hook_PlayerInfo_updateXP, this);
        this.installHook(PlayerInfo.prototype, 'updateTooltip', this.hook_PlayerInfo_updateTooltip, this);
        this.installHook(window, 'initializeUI', this.hook_window_initializeUI, this);
    }

    hook_Camera_update() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].update === 'function') {
                this.moduleList[i].update.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_Network_logoutOK() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].logoutOK === 'function') {
                this.moduleList[i].logoutOK.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_Network_action() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].action === 'function') {
                this.moduleList[i].action.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_Network_handle() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].handle === 'function') {
                this.moduleList[i].handle.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_PhasedLoadingManager_start_phase(phase) {
        if(phase === "game_loaded") {
            for (var i = 0; i < this.moduleList.length; i++) {
                if(typeof this.moduleList[i].loginOK === 'function') {
                    this.moduleList[i].loginOK.apply(this.moduleList[i], arguments);
                }
            }
        }
    }

    hook_PlayerInfo_updateXP() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].updateXP === 'function') {
                this.moduleList[i].updateXP.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_PlayerInfo_updateTooltip() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].updateTooltip === 'function') {
                this.moduleList[i].updateTooltip.apply(this.moduleList[i], arguments);
            }
        }
    }

    hook_window_initializeUI() {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(typeof this.moduleList[i].initializeUI === 'function') {
                this.moduleList[i].initializeUI.apply(this.moduleList[i], arguments);
            }
        }
    }

    registerModule(module) {
        this.moduleList[this.moduleList.length] = module;
    }

    unregisterModule(module) {
        for (var i = 0; i < this.moduleList.length; i++) {
            if(this.moduleList[i] === module) {
                this.moduleList.splice(i, 1);
                break;
            }
        }
    }

    installHook(object, functionName, callback, callback_this) {
        (function(originalFunction) {
            object[functionName] = function () {
                var returnValue = originalFunction.apply(this, arguments);
                if(callback !== undefined) {
                    callback.apply(callback_this ?? this, arguments);
                }

                return returnValue;
            };
        }(object[functionName]));
    }

    sendDataToServer(url, data) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", `https://nextgensoftware.nl/${url}.php`);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(data));
    }
}

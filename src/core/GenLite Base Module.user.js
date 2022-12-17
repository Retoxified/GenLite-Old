// ==UserScript==
// @name         GenLite Base Module
// @namespace    GenLite
// @version      0.1.2
// @description  try to take over the world!
// @author       TwistedFate#4053
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==

(function() {
    class GenLite {
        moduleList = [];

        init() {
            this.installHook(Camera.prototype, 'update', this.hook_Camera_update, this);
            this.installHook(Network.prototype, 'logoutOK', this.hook_Network_logoutOK, this);
            this.installHook(PhasedLoadingManager.prototype, 'start_phase',  this.hook_PhasedLoadingManager_start_phase,  this);
            this.installHook(Network.prototype, 'action', this.hook_Network_action, this);
            this.installHook(Network.prototype, 'handle', this.hook_Network_handle, this);
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

    }

    window.genlite = new GenLite();
    window.genlite.init();
})();

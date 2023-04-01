/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.interface';

import Stats from '../../thirdPartyModules/Stats.js/build/stats.module';

export class GenLiteFPSCounter implements GenLitePlugin {
    static pluginName = 'GenLiteFPSCounter';

    stats;

    isPluginEnabled: boolean;
    isInit: boolean = false;
    doUpdateFPS: boolean;
    async init() {
        document.genlite.registerPlugin(this);

        this.isPluginEnabled = document.genlite.settings.add("FPSCounter.Enable", false, "FPS Counter", "checkbox", this.handlePluginEnableDisable, this);
        this.stats = Stats({
            fps: {
                fg: '#eb8c39',
                bg: '#5d2309'
            },
            ms: {
                fg: '#eb8c39',
                bg: '#5d2309'
            },
            mb: {
                fg: '#eb8c39',
                bg: '#5d2309'
            }
        });
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        if (state) {
            this.loginOK();
            this.initializeUI();
        } else {
            this.logoutOK();
        }
    }
    
    handlePluginState(state: boolean): void {
        // TODO: Implement
        // Display Yellow Console Message Stating the plugin needs to implement this
        console.log(`%c[GenLite] %c${this.constructor.name} %cneeds to implement handlePluginState()`, "color: #ff0", "color: #fff", "color: #f00");
    }

    /* start tracking fps */
    loginOK() {
        if (!this.isPluginEnabled)
            return;

        this.doUpdateFPS = true;
        this.stats.dom.style.display = 'block';
        this.fpsCounter();
    }

    /* stop tracking fps */
    logoutOK() {
        this.doUpdateFPS = false;
        this.stats.dom.style.display = 'none';
    }

    /* setup element */
    initializeUI() {
        if (!this.isPluginEnabled)
            return;
        if (this.isInit)
            return;

        this.stats.dom.style.display = 'block';
        this.stats.dom.style.position = 'absolute';
        this.stats.dom.style.left = '';
        this.stats.dom.style.right = '0px';
        this.stats.dom.style.top = '30px';
        this.stats.dom.style.zIndex = '9998';
        document.body.appendChild(this.stats.dom);
        this.isInit = true;
    }

    /* loops on request animation for for some reason shows the overall frame rate of the webpage i guess */
    fpsCounter() {
        if (!(this.doUpdateFPS && this.isPluginEnabled))
            return
        this.stats.update();
        requestAnimationFrame(this.fpsCounter.bind(this))
    }
}
/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

import Stats from '../../../thirdPartyModules/Stats.js/build/stats.module.js';

export class GenLiteFPSCounter extends GenLitePlugin {
    static pluginName = 'GenLiteFPSCounter';

    stats;

    isPluginEnabled: boolean;
    isInit: boolean = false;
    doUpdateFPS: boolean;

    async init() {
        document.genlite.registerPlugin(this);
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

    async postInit(): Promise<void> {
        document.genlite.ui.registerPlugin("FPS Counter", null, this.handlePluginState.bind(this));
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        if (state) {
            this.stats.dom.style.display = 'block';
            this.initializeUI();
        } else {
            this.Network_logoutOK();
        }
    }

    /* stop tracking fps */
    Network_logoutOK() {
        this.doUpdateFPS = false;
        this.stats.dom.style.display = 'none';
    }

    /* setup element */
    initializeUI() {
        if (!this.isPluginEnabled)
            return;
        if (this.isInit)
            return;
        this.doUpdateFPS = true;
        this.fpsCounter();
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
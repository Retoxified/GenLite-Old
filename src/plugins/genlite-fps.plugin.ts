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

export class GenLiteFPSCounter implements GenLitePlugin {
    static pluginName = 'GenLiteFPSCounter';

    statsPlugin = require("stats.js");
    stats = new this.statsPlugin()

    oldRequestAnimiationFrame;

    isPluginEnabled: boolean;
    async init() {
        document.genlite.registerPlugin(this);

        this.isPluginEnabled = document.genlite.settings.add("FPSCounter.Enable", true, "FPS Counter", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        if (state) {
            this.stats.dom.style.display = 'block';
            this.fpsCounter();
        } else {
            this.stats.dom.style.display = 'none';
        }
    }

    initializeUI() {
        if (!this.isPluginEnabled)
            return;

        this.stats.dom.style.display = 'block';
        this.stats.dom.style.position = 'absolute';
        document.body.appendChild(this.stats.dom);
        requestAnimationFrame(this.fpsCounter.bind(this));
    }

    fpsCounter(){
        if (!this.isPluginEnabled)
            return
        this.stats.update();
        requestAnimationFrame(this.fpsCounter.bind(this))
    }
}
/*
    Copyright (C) 2022 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import {GenLitePlugin} from '../core/interfaces/plugin.class';

export class GenLiteMenuScaler extends GenLitePlugin {
    static pluginName = 'GenLiteMenuScaler';

    scaleList;

    isPluginEnabled: boolean = false;

    pluginSettings : Settings = {
        "Right Click Menu": {
            type: "range",
            oldKey: "GenLite.MenuScalerRightCLick.1",
            value: 1,
            min: 0.1,
            max: 4,
            step: 0.1,
            stateHandler: this.scaleRightClick.bind(this)
        }
    }


    async init() {
        document.genlite.registerPlugin(this);
        this.scaleList = {};
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Menu Scaler", "GenLite.MenuScaler.Enable", this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        let menu = <HTMLDivElement>document.getElementById("new_ux-contextual-menu-modal");
        if (state) {
            menu.style.transform = `scale(${this.scaleList.rightClick})`;
        } else {
            menu.style.transform = "";
        }
    }

    scaleRightClick(scaler: Number) {
        this.scaleList.rightClick = scaler;
        if (!this.isPluginEnabled) {
            return;
        }
        let menu = document.getElementById("new_ux-contextual-menu-modal");
        menu.style.transform = `scale(${scaler})`;
    }

    initializeUI() {
        if (!this.isPluginEnabled) {
            return;
        }
        let menu = document.getElementById("new_ux-contextual-menu-modal");
        menu.style.transform = `scale(${this.scaleList.rightClick})`;
    }


}

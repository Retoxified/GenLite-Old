/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteInventoryPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteInventoryPlugin';

    disableDragOnShift: boolean = false;

    async init() {
        document.genlite.registerPlugin(this);
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Inventory Drag-On-Shift", null, this.handlePluginState.bind(this));
    }

    public loginOK() {
        this.updateState();
    }

    handlePluginState(state: boolean): void {
        this.disableDragOnShift = !state;
        this.updateState();
    }


    updateState() {
        if (this.disableDragOnShift) {
            for (const i in document.game.INVENTORY.DOM_slots) {
                let slot = document.game.INVENTORY.DOM_slots[i];
                slot.item_div.onmousedown = function (e) {
                    if (e.shiftKey) {
                        e.preventDefault();
                    }
                }
            }
        } else {
            for (const i in document.game.INVENTORY.DOM_slots) {
                let slot = document.game.INVENTORY.DOM_slots[i];
                slot.item_div.onmousedown = function (e) { };
            }
        }
    }
}

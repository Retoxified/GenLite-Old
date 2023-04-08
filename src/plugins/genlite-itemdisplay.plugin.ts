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

export class GenLiteItemDisplays extends GenLitePlugin {
    static pluginName = 'GenLiteItemDisplays';

    isPluginEnabled: boolean = false;
    isUIInit: boolean = false;
    async init() {
        document.genlite.registerPlugin(this);
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Additional Item Info", null, this.handlePluginState.bind(this));
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        if (state) {
            this.initializeUI();
            this.Inventory_handleUpdatePacket(document.game.INVENTORY.items);
            this.Bank_handlePacket(document.game.BANK.slots);
        } else {
            let spans = document.getElementsByClassName("genlite_item_extras");
            for (let span in spans) {
                if (spans[span].innerHTML)
                    spans[span].innerHTML = "";
            }
        }
    }

    /* add our element to the games DOMs */
    initializeUI() {
        if (!this.isPluginEnabled)
            return;

        if (this.isUIInit)
            return;

        this.initUI(document.game.INVENTORY.DOM_slots);
        this.initUI(document.game.BANK.DOM_slots);
        this.initUI(document.game.BANK.quality_DOM_slots);
        this.initUI(document.game.TRADE.DOM_your_slots);
        this.initUI(document.game.TRADE.DOM_their_slots);
        this.isUIInit = true;
        this.Inventory_handleUpdatePacket(document.game.INVENTORY.items);
        this.Bank_handlePacket(document.game.BANK.slots);
    }

    /* creates an element and appends it to the dom list passed */
    initUI(DOMs) {
        for (let key in DOMs) {
            let slot = DOMs[key];
            let div = document.createElement('div');
            div.classList.add("new_ux-item-quantity-div");
            div.style.top = "60%"
            //div.style.textAlign = "right"
            let span = document.createElement('span');
            div.appendChild(span);
            span.classList.add("new_ux-item-quantity-span");
            span.classList.add("genlite_item_extras")
            span.innerHTML = "samual smells";
            /* code reuse compatibility */
            if (slot.item_div)
                slot.item_div.appendChild(div);
            if (slot.div)
                slot.div.appendChild(div);
            slot.item_extra = div;
        }
    }

    /*  these all update our element when needed */
    Inventory_handleUpdatePacket(payload) {
        if (!this.isPluginEnabled)
            return;
        this.itemExtraUpdate(payload, document.game.INVENTORY.DOM_slots);
    }

    Bank_handlePacket(payload: any) {
        if (!this.isPluginEnabled)
            return;
        this.itemExtraUpdate(payload.bank_contents, document.game.BANK.DOM_slots);

    }

    Bank__showQualityPopup(payload: any) {
        if (!this.isPluginEnabled)
            return;
        this.itemExtraUpdate(document.game.BANK.quality_slots, document.game.BANK.quality_DOM_slots);
    }

    Trade_handlePacket(payload) {
        if (!this.isPluginEnabled)
            return;
        this.itemExtraUpdate(payload[0].contents.myOffer, document.game.TRADE.DOM_your_slots);
        this.itemExtraUpdate(payload[0].contents.theirOffer, document.game.TRADE.DOM_their_slots);
    }

    itemExtraUpdate(slots, doms) {
        for (let key in slots) {
            let item = slots[key];
            if (!item.item)
                continue;
            let extraStr = "";
            if (item.item.includes("lean") || item.item.includes("conditional-defense")) {
                extraStr = "L";
            } else if (item.item.includes("fatty") || item.item.includes("conditional-strength")) {
                extraStr = "F";
            } else if (item.item.includes("+1")) {
                extraStr = "+1";
            } else if (item.item.includes("+2")) {
                extraStr = "+2";
            }
            doms[key].item_extra.children[0].innerHTML = extraStr;
        }
    }
}

/*
    Copyright (C) 2022-2023 Retoxified, dpeGit, snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteEnhancedBanking extends GenLitePlugin {
    static pluginName = 'GenLiteEnhancedBanking';

    isEnabled: boolean = false;


    pluginSettings : Settings = {}

    BANK: Bank;
    toWith: {[slot: number]: {
        quantity: number,
        quality: string  /* _lq, '', _hq for the 3 qualities */
    }} = {};
    lastSlot: number = 0;

    intersect_vector = new document.game.THREE.Vector3();
    async init() {
        document.genlite.registerPlugin(this);
        this.BANK = document.game.BANK;
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Enhanced Banking", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        this.isEnabled = state;
    }

    /* adds another option to withdraw N items being the last withdraw X amount
        without going through the prompt
        ctrl moves this option to the top of the list
    */
    _addContextOptionsActual(item, contextMenu, n) {
        if (this.isEnabled == false) return;
        let toWithdraw = this.toWith[this.lastSlot] ? this.toWith[this.lastSlot].quantity : 1
        contextMenu.push({
            color: "none",
            priority: document.game.KEYBOARD['17'] ? 999 : 1,
            object: n,
            text: `Withdraw ${toWithdraw}`,
            action: () => {
                "unknown" == item.item ? document.game.NETWORK_CONTAINER.network.action("bank_action", {
                    action: "withdraw",
                    item: item.original_item,
                    quantity: toWithdraw
                }) : document.game.NETWORK_CONTAINER.network.action("bank_action", {
                    action: "withdraw",
                    item: item.item,
                    quantity: toWithdraw
                })
            }
        })
    }

    /* same as the above function but for stacked qualities
        this uses the last quality withdrawn from the bank from ANY slot
    */
    _addContextOptions(itemSlot: any, contextMenu: any) {
        if (this.isEnabled == false) return;
        let toWithdraw = this.toWith[this.lastSlot] ? this.toWith[this.lastSlot].quantity : 1
        let n    = itemSlot + this.BANK.selected_page * document.game.SOME_CONST_USED_FOR_BANK;
        let item = this.BANK.slots[n];
        let a = item.item.substring(3);
        a = a.concat(this.toWith[itemSlot]? this.toWith[itemSlot].quality : "");
        let itemHumanName = `<span class='item'>${document.game.returnsAnItemName(a)}</span>`;
        let r = {
            type: "item",
            id: item,
            text: () => itemHumanName
        }
        if (item.item.startsWith('$q')) {
            contextMenu.push({
                color: "none",
                priority: document.game.KEYBOARD['17'] ? 999 : 1,
                object: r,
                text: `Withdraw ${toWithdraw}`,
                action: () => {
                    document.game.NETWORK_CONTAINER.network.action("bank_action", {
                        action: "withdraw",
                        item: a,
                        quantity: toWithdraw
                    })
                }
            })
        }
        this.lastSlot = itemSlot;
    }

    /* figure out what the last quality was we withdrew */
    action(verb, param) {
        if (this.isEnabled == false) return;
        if (verb == 'bank_action') {
            if (param.action == 'withdraw') {
                this.toWith[this.lastSlot] = {quantity: 1, quality: ''};
                if (param.item.match(/_lq$/)) {
                    this.toWith[this.lastSlot].quality = '_lq';
                } else if (param.item.match(/_hq$/)) {
                    this.toWith[this.lastSlot].quality = '_hq';
                } else {
                    this.toWith[this.lastSlot].quality = ''; //nq case
                }
                this.toWith[this.lastSlot].quantity = this.BANK.saved_withdraw_x ? this.BANK.saved_withdraw_x : 1;
                this.log(param, "plspls", verb, this.toWith);
            }
        }
    }
}

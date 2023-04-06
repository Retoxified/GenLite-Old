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


    pluginSettings: Settings = {}

    BANK: Bank;
    toWith: {
        [baseItem: string]: {
            '_lq': number
            '_hq': number
            '': number
            'lastQual': string
        }
    } = {};
    lastQual: string;

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
    Bank__addContextOptionsActual(item, contextMenu, n) {
        if (this.isEnabled == false) return;
        let baseItem = item.item;
        let qual = ''
        if (baseItem.match(/(_lq|_hq)$/)) {
            baseItem = baseItem.substring(0, baseItem.length - 3);
            qual = baseItem.substring(baseItem.length - 3);
        }
        this.toWith[baseItem] = this.toWith[baseItem] ? this.toWith[baseItem] :  { '_lq': 1, '_hq': 1, '': 1, lastQual: '' };
        let toWithdraw = this.toWith[baseItem] ? this.toWith[baseItem][qual] : 1
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
    Bank__addContextOptions(itemSlot: any, contextMenu: any) {
        if (this.isEnabled == false) return;
        let n = itemSlot + this.BANK.selected_page * document.game.SOME_CONST_USED_FOR_BANK;
        let item = this.BANK.slots[n];
        if (item.item.startsWith('$q')) {
            let baseItem = item.item.substring(3);
            this.toWith[baseItem] =  this.toWith[baseItem] ? this.toWith[baseItem] :  { '_lq': 1, '_hq': 1, '': 1, lastQual: '' };    
            for (let qual of ['_lq', '', '_hq']) {
                let qual2 = qual == '' ? 'mq' : qual.substring(1);
                if (item.stored_amounts[qual2] <= 0)
                    continue;
                let itemWithQual = baseItem.concat(qual)
                let itemHumanName = `<span class='item'>${document.game.returnsAnItemName(itemWithQual)}</span>`;
                let r = {
                    type: "item",
                    id: item,
                    text: () => itemHumanName
                }
                contextMenu.push({
                    color: "none",
                    priority: this.toWith[baseItem][this.lastQual] == qual ? (document.game.KEYBOARD['17'] ? 999 : 1) : 1,
                    object: r,
                    text: `Withdraw ${this.toWith[baseItem][qual]}`,
                    action: () => {
                        document.game.NETWORK_CONTAINER.network.action("bank_action", {
                            action: "withdraw",
                            item: itemWithQual,
                            quantity: this.toWith[baseItem][qual]
                        })
                    }
                })
            }
        }
    }

    /* record the amount and quality withdrawn */
    Network_action(verb, param) {
        if (this.isEnabled == false) return;
        if (verb == 'bank_action') {
            if (param.action == 'withdraw') {
                if (param.item.match(/_lq$/)) {
                    this.toWith[param.item.substring(0, param.item.length - 3)]['_lq'] = param.quantity;
                    this.toWith[param.item.substring(0, param.item.length - 3)]['lastQual'] = '_lq';
                } else if (param.item.match(/_hq$/)) {
                    this.toWith[param.item.substring(0, param.item.length - 3)]['_lq'] = param.quantity;
                    this.toWith[param.item.substring(0, param.item.length - 3)]['lastQual'] = '_hq';
                } else {
                    this.toWith[param.item][''] = param.quantity;
                    this.toWith[param.item]['lastQual'] = '';
                }
            }
        }
    }

    _getContextOptionsBank(e, t, n){
        this.log(e);
        this.log(t);
        this.log(n);
    }
}

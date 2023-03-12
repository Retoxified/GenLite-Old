/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import {GenLitePlugin} from '../core/interfaces/plugin.interface';

export class GenLiteItemTooltips implements GenLitePlugin {
    static pluginName = 'GenLiteItemTooltips';

    itemToolTip: HTMLElement;
    healthBarHealing: HTMLElement; //this name sucks

    curCombat;
    pacifistTime = 0; // we can just assume on init its probably been 5 minutes or at the very least it doesnt matter, i mean who uses veggies
    stepCount = 0;

    isUiInit: boolean = false;
    isPluginEnabled: boolean = false;
    isFoodEnabled: boolean = false;
    isValueEnabled: boolean = false;

    async init() {
        document.genlite.registerPlugin(this);

        this.isPluginEnabled = document.genlite.settings.add("ItemToolTips.Enable", true, "Tooltips", "checkbox", this.handlePluginEnableDisable, this);
        this.isFoodEnabled = document.genlite.settings.add("FoodToolTips.Enable", true, "Food Tooltips", "checkbox", this.handleFoodEnableDisable, this, undefined, undefined, "ItemToolTips.Enable");
        this.isValueEnabled = document.genlite.settings.add("ValueToolTips.Enable", true, "Value Tooltips", "checkbox", this.handleValueEnableDisable, this, undefined, undefined, "ItemToolTips.Enable");


    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        if (state) {
            if (!this.isUiInit) // if non inited run
                this.initToolTip();
        } else {
            this.onmouseleave(null, this) //hijac onmouseleave for disable function
        }
    }

    handleFoodEnableDisable(state: boolean) {
        this.isFoodEnabled = state;
    }
    handleValueEnableDisable(state: boolean) {
        this.isValueEnabled = state;
    }


    initializeUI() {
        if (this.isPluginEnabled === false) {
            return;
        }
        this.initToolTip();
    }

    /* inits the tooltip and other elements
    */
    initToolTip() {
        for (let slot in INVENTORY.DOM_slots) {
            let DOM_slot = INVENTORY.DOM_slots[slot].item_div;
            DOM_slot.onmouseenter = this.installEventHook(DOM_slot.onmouseenter, this.onmouseenter, this);
            DOM_slot.onmousemove = this.installEventHook(DOM_slot.onmousemove, this.onmousemove, this);
            DOM_slot.onmouseleave = this.installEventHook(DOM_slot.onmouseleave, this.onmouseleave, this);
            DOM_slot.onclick = this.installEventHook(DOM_slot.onclick, this.onclick, this);

        }
        /* setup the tool tip, im lazy and just copy the computed style of the xp on
            seems to work fine
        */
        let genfanadToolTip = document.getElementById("skill_status_popup");
        this.itemToolTip = <HTMLElement>genfanadToolTip.cloneNode(true);
        this.itemToolTip.id = "GenLite_Item_Tooltip"
        this.itemToolTip.innerHTML = "samual smells";
        const computedStyle = window.getComputedStyle(genfanadToolTip);
        Array.from(computedStyle).forEach(key => this.itemToolTip.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)))
        this.itemToolTip.style.setProperty("-webkit-text-fill-color", "");
        this.itemToolTip.style.overflow = "hidden";
        this.itemToolTip.style.display = "none";
        document.body.appendChild(this.itemToolTip);

        /* create the health bar extention */
        this.healthBarHealing = document.createElement("div");
        this.healthBarHealing.id = "Genlite_Health_Bar_Healing";
        this.healthBarHealing.style.height = "100%";
        this.healthBarHealing.style.width = "0%";
        this.healthBarHealing.style.background = "LimeGreen";
        let healthbar = document.getElementById("new_ux-hp-bar__meter--bar");
        healthbar.after(this.healthBarHealing);

        this.isUiInit = true;
    }

    /* every time health is updated move the healthBarHealing element to where the end of the health bar is */
    setHealth(current, max) {
        if (this.isUiInit) {
            let healthbar = document.getElementById("new_ux-hp-bar__meter--bar");
            this.healthBarHealing.style.left = healthbar.style.width;
        }
    }

    /* figure out which npc we are fighting and when that combat ends */
    handle(verb, payload) {
        if (this.isPluginEnabled === false || NETWORK.loggedIn === false) {
            return;
        }

        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {
            this.curCombat = payload.id;
            this.pacifistTime = Number.POSITIVE_INFINITY;
            return;
        }
        if (verb == "removeObject" && payload.type == "combat" && payload.id == this.curCombat) {
            this.curCombat = "";
            this.pacifistTime = Date.now();
            return;
        }

        if (verb == "move" && PLAYER && payload.id == PLAYER.id) {
            this.stepCount++;
            return;
        }
    }

    /* do the toolbar stuff depending on what item your hovering over */
    onmouseenter(event, callback_this) {
        if (callback_this.isPluginEnabled === false) {
            return;
        }
        let slot = parseInt(event.target.offsetParent.slot_number); //pls dont change this field heleor; EDIT: damnit heleor you changed it like an hour after i wrote this line you asshat
        callback_this.itemToolTip.style.display = "block";
        callback_this.itemToolTip.style.top = `${event.clientY + 15}px`
        if (window.innerWidth < callback_this.itemToolTip.getClientRects()[0].right + 15) {
            callback_this.itemToolTip.style.left = `${window.innerWidth - callback_this.itemToolTip.getClientRects()[0].width - 15}px`
        } else {
            callback_this.itemToolTip.style.left = `${event.clientX + 15}px`
        }

        let itemData = DATA.items[INVENTORY.items[slot].item];
        callback_this.itemToolTip.innerHTML = "";
        if (callback_this.isFoodEnabled && itemData.consumable && itemData.consumable.vitality)
            callback_this.foodTooltip(itemData, callback_this);
        if (callback_this.isFoodEnabled && itemData.consumable && itemData.consumable.condition)
            callback_this.foodCondTooltip(itemData, callback_this);
        if (callback_this.isValueEnabled && itemData.value)
            callback_this.valueTooltip(itemData, callback_this);
        if (callback_this.itemToolTip.innerHTML == "")
            callback_this.itemToolTip.style.display = "none";
    }

    /* update tooltip position */
    onmousemove(event, callback_this) {
        if (callback_this.isPluginEnabled === false) {
            return;
        }
        if (callback_this.itemToolTip.style.display == "none")
            return;
        if (window.innerWidth <= callback_this.itemToolTip.getClientRects()[0].right + 15) {
            callback_this.itemToolTip.style.left = `${window.innerWidth - callback_this.itemToolTip.getClientRects()[0].width - 15}px`
        } else {
            callback_this.itemToolTip.style.left = `${event.clientX + 15}px`
        }
        callback_this.itemToolTip.style.top = `${event.clientY + 15}px`
        callback_this.itemToolTip.style.display = "block";
    }

    /* disable all the stuff */
    onmouseleave(event, callback_this) {
        callback_this.itemToolTip.style.display = "none";
        callback_this.healthBarHealing.style.width = "0%";
    }

    onclick(event, callback_this) {
        let slot = 0;
        if (event.target.classList.contains("new_ux-item-quantity-span")) {
            slot = event.target.offsetParent.offsetParent.offsetParent.slot_number; //this is stupid
        } else {
            slot = event.target.offsetParent.offsetParent.slot_number;
        }
        let itemData = DATA.items[INVENTORY.items[slot].item];
        if (callback_this.isFoodEnabled && itemData.consumable
            && itemData.consumable.condition && itemData.consumable.condition.params.threshold_steps)
            callback_this.stepCount = 0;

    }

    /* simple hook that runs this.onmouseenter() after the game function */
    installEventHook(eventBase, callback, callback_this) {
        let oldE = eventBase;
        if (typeof eventBase != 'function') // if event base isnt a function just set the callback
            return (event) => { callback(event, callback_this) };
        let newE = (event) => { oldE(event); callback(event, callback_this); };
        return newE;
    }

    /* displays the healing amount and change to health
        as well as inidcates on the health bar
    */
    foodTooltip(itemData, callback_this) {
        let healing = itemData.consumable.vitality;
        let totalHealth = PLAYER_INFO.skills.vitality.level;
        let curHealth = PLAYER_INFO.skills.vitality.current;
        let healedHealth = Math.min(totalHealth, curHealth + healing);
        let healingAmount = Math.min(healedHealth - curHealth, healing)
        let textColor = (curHealth + healing > totalHealth) ? "red" : "LimeGreen";
        callback_this.itemToolTip.innerHTML += `
        <div>Heal Amount: <span style="color:${textColor}">${healingAmount}</span></div>
        <div>Health: <span style="color:${textColor}">${healedHealth}</span>/${totalHealth}</div>`

        let healPercent = healingAmount / totalHealth;
        callback_this.healthBarHealing.style.width = `${healPercent * 100}%`;
    }

    /* test the condition for conditional food to print the correct value */
    foodCondTooltip(itemData, callback_this) {
        let healing = "";
        let condition = itemData.consumable.condition
        let dummyItem = { consumable: { vitality: 0 } };
        switch (condition.params.trigger) {
            case "skill_below_threshold_%":
                switch (condition.params.skill) {
                    case "vitality":
                        dummyItem.consumable.vitality = PLAYER_INFO.skills.vitality.current < PLAYER_INFO.skills.vitality.level * condition.params.threshold_rate
                            ? condition.true.vitality : condition.false.vitality;
                        break;
                }
                break;
            case "skill_compare_greater":
                let skillA = condition.params.skill_a;
                let skillB = condition.params.skill_b;
                dummyItem.consumable.vitality = PLAYER_INFO.skills[skillA].level > PLAYER_INFO.skills[skillB].level
                    ? condition.true.vitality : condition.false.vitality;
                break;
            case "location_layer":
                dummyItem.consumable.vitality = PLAYER_INFO.location.layer == condition.params.layer
                    ? condition.true.vitality : condition.false.vitality;
                break;
            case "pacifist":
                // ticks are 150ms
                let oocTime = Date.now() - callback_this.pacifistTime;
                dummyItem.consumable.vitality = oocTime >= condition.params.threshold_ticks * 150
                    ? condition.true.vitality : condition.false.vitality
                break;
            case "wanderer":
                dummyItem.consumable.vitality = callback_this.stepCount >= condition.params.threshold_steps
                    ? condition.true.vitality : condition.false.vitality;
                break;
        }
        callback_this.foodTooltip(dummyItem, callback_this);
    }

    valueTooltip(itemData, callback_this) {
        let value = Math.max(Math.floor(itemData.value / 10), 1);
        callback_this.itemToolTip.innerHTML += `
        <div>Value: ${value}</div>`
    }

}

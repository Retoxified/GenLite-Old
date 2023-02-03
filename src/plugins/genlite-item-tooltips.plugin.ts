export class GenLiteItemTooltips {
    static pluginName = 'GenLiteItemTooltips';

    itemToolTip: HTMLElement;
    healthBarHealing: HTMLElement; //this name sucks

    isUiInit: boolean = false;
    isPluginEnabled: boolean = false;
    isFoodEnabled: boolean = false;
    isValueEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.isPluginEnabled = window.genlite.settings.add("ItemToolTips.Enable", true, "Tooltips", "checkbox", this.handlePluginEnableDisable, this);
        this.isFoodEnabled = window.genlite.settings.add("ItemToolTips.Enable", true, "Food Tooltips", "checkbox", this.handleFoodEnableDisable, this);
        this.isValueEnabled = window.genlite.settings.add("ItemToolTips.Enable", true, "Value Tooltips", "checkbox", this.handleValueEnableDisable, this);


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
    }

    /* every time health is updated move the healthBarHealing element to where the end of the health bar is */
    setHealth(current, max) {
        let healthbar = document.getElementById("new_ux-hp-bar__meter--bar");
        this.healthBarHealing.style.left = healthbar.style.width;
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

        let healthbar = document.getElementById("new_ux-hp-bar__meter--bar");
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
                //TODO: this is a time out of combat based on ticks but no clue how long a tick is
                dummyItem.consumable.vitality = condition.false.vitality;
                break;
            case "wanderer":
                //TODO: need step counter
                dummyItem.consumable.vitality = condition.false.vitality;
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
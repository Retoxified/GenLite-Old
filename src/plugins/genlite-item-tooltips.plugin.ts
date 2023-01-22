export class GenLiteItemTooltips {
    static pluginName = 'GenLiteItemTooltips';

    itemToolTip: HTMLElement;
    healthBarHealing: HTMLElement; //this name sucks

    isUiInit: boolean = false;
    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.isPluginEnabled = window.genlite.settings.add("ItemToolTips.Enable", true, "Food Tooltips", "checkbox", this.handlePluginEnableDisable, this);

    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        if(state){
            if (!this.isUiInit) // if non inited run
                this.initToolTip();
        } else {
            this.onmouseleave(null, this) //hijac onmouseleave for disable function
        }
    }

    initializeUI(){
        if (this.isPluginEnabled === false) {
            return;
        }
        this.initToolTip();
    }

    /* inits the tooltip and other elements
    */
    initToolTip() {
        for(let slot in INVENTORY.DOM_slots){
            let DOM_slot = INVENTORY.DOM_slots[slot].item_div;
            DOM_slot.onmouseenter = this.installEventHook(DOM_slot.onmouseenter, this.onmouseenter, this);
            DOM_slot.onmousemove = this.installEventHook(DOM_slot.onmousemove, this.onmousemove, this);
            DOM_slot.onmouseleave = this.installEventHook(DOM_slot.onmouseleave, this.onmouseleave, this);

        }
        /* setup the tool tip, im lazy and just copy the computed style of the xp on
            seems to work fine
        */
        let genfanadToolTip = document.getElementById("skill_status_popup");
        this.itemToolTip = <HTMLElement> genfanadToolTip.cloneNode(true);
        this.itemToolTip.id = "GenLite_Item_Tooltip"
        this.itemToolTip.innerHTML = "samual smells";
        const computedStyle = window.getComputedStyle(genfanadToolTip);
        Array.from(computedStyle).forEach(key => this.itemToolTip.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)))      
        this.itemToolTip.style.setProperty("-webkit-text-fill-color", "");
        this.itemToolTip.style.display = "none";
        document.body.appendChild(this.itemToolTip);

        /* create the health bar extention */
        this.healthBarHealing = document.createElement("div");
        this.healthBarHealing.id = "Genlite_Health_Bar_Healing";
        this.healthBarHealing.style.height = "100%";
        this.healthBarHealing.style.width = "0%";
        this.healthBarHealing.style.background = "LimeGreen";
        let healthbar = document.getElementById("new_ux-hp-bar__meter--wrapper");
        healthbar.appendChild(this.healthBarHealing);
    }

    /* do the toolbar stuff depending on what item your hovering over */
    onmouseenter(event, callback_this) {
        if (callback_this.isPluginEnabled === false) {
            return;
        }
        callback_this.itemToolTip.style.left = `${event.clientX + 15}px`
        callback_this.itemToolTip.style.top = `${event.clientY + 15}px`
        callback_this.itemToolTip.style.display = "block";
        let slot  = parseInt(event.target.offsetParent.slot_number); //pls dont change this field heleor; EDIT: damnit heleor you changed it like an hour after i wrote this line you asshat
        let itemData = DATA.items[INVENTORY.items[slot].item];
        if(itemData.consumable && itemData.consumable.vitality){
            callback_this.foodTooltip(itemData, callback_this);
        } else {
            callback_this.itemToolTip.style.display = "none";
        }
    }

    /* update tooltip position */
    onmousemove(event, callback_this){
        if (callback_this.isPluginEnabled === false) {
            return;
        }
        if(callback_this.itemToolTip.style.display == "none")
            return;
        callback_this.itemToolTip.style.left = `${event.clientX + 15}px`
        callback_this.itemToolTip.style.top = `${event.clientY + 15}px`
        callback_this.itemToolTip.style.display = "block";
    }

    /* disable all the stuff */
    onmouseleave(event, callback_this){
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
    foodTooltip(itemData, callback_this){
        let healing = itemData.consumable.vitality;
        let totalHealth = PLAYER_INFO.skills.vitality.level;
        let curHealth = PLAYER_INFO.skills.vitality.current;
        let healedHealth = Math.min(totalHealth, curHealth + healing);
        let healingAmount = Math.min(healedHealth - curHealth, healing)
        let textColor = (curHealth + healing > totalHealth) ? "red" : "LimeGreen";
        callback_this.itemToolTip.innerHTML = `
        <div>Heal Amount: <span style="color:${textColor}">${healing}</span></div>
        <div>Health: <span style="color:${textColor}">${healedHealth}</span>/${totalHealth}</div>`

        let healthbar = document.getElementById("new_ux-hp-bar__meter--bar");
        let healPercent = healingAmount / totalHealth;
        callback_this.healthBarHealing.style.left = healthbar.style.width;
        callback_this.healthBarHealing.style.width = `${healPercent * 100}%`;
    }

}
export class GenLiteXpCalculator {
    static pluginName = 'GenLiteXpCalculatorPlugin';

    skillsList = {
        vitality: {
            numActions: 0,
            avgActionXP: 0,
            actionsToNext: 0,
            tsStart: 0,
            startXP: 0
        },
        attack: {},
        strength: {},
        defense: {},
        ranged: {},
        sorcery: {},
        cooking: {},
        forging: {},
        artistry: {},
        tailoring: {},
        whittling: {},
        evocation: {},
        survival: {},
        piety: {},
        logging: {},
        mining: {},
        botany: {},
        butchery: {},
        total: {
            numActions: 0,
            avgActionXP: 0,
            tsStart: 0,
            startXP: 0,
            gainedXP: 0
        }
    };
    totalXP;
    tracking;
    tracking_skill = "";
    isHookInstalled = false;

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);
        this.resetCalculatorAll();
        this.isPluginEnabled = window.genlite.settings.add("XPCalculator.Enable", true, "XP Calculator", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        this.resetCalculatorAll();
        /* if toggle on mid way through we have to run the init code */
        if (state) {
            this.initializeUI();
            this.updateSkills();
        }
    }

    /* we need the UI to be initalized before hooking */
    initializeUI() {
        if (!this.isPluginEnabled || this.isHookInstalled) {
            return;
        }
        let toolTipRoot = document.getElementsByClassName("new_ux-player-info-modal__modal__window--stats__skill__container");
        let totLevelRoot = <HTMLElement>document.getElementsByClassName("new_ux-player-info-modal__modal__window--stats__section__list__row")[1];
        for (let i = 0; i < 18; i++) {
            let tooltip = <HTMLElement>toolTipRoot[i];
            tooltip.onmouseenter = this.installEventHook(tooltip.onmouseenter, this.onmouseenter, this);
            tooltip.onmousedown = this.installEventHook(tooltip.onmousedown, this.onmousedown, this)
        }
        // set up the tool tip for total levels
        totLevelRoot.onmouseenter = (event) => (this.totalLevelCalc(event, this));
        totLevelRoot.onmousedown = (event) => (this.onmousedown(event, this));
        totLevelRoot.onmousemove = (<HTMLElement>toolTipRoot[0]).onmousemove;
        totLevelRoot.onmouseleave = (<HTMLElement>toolTipRoot[0]).onmouseleave;
        this.isHookInstalled = true
    }

    /* when an xp update comes calculate skillsList fields */
    updateXP(xp) {
        if (!this.isPluginEnabled) {
            return;
        }
        // this section feels ugly and should be cleaned up
        [xp.skill, "total"].forEach(element => {

            let skill = this.skillsList[element];
            let avg = skill.avgActionXP;
            avg *= skill.numActions;
            avg += xp.xp;
            skill.numActions++;
            skill.avgActionXP = avg / skill.numActions;
            if (element == "total")
                skill.gainedXP += xp.xp;
            if (element != "total")
                skill.actionsToNext = Math.ceil(PLAYER_INFO.skills[element].tnl / skill.avgActionXP);
            if (skill.tsStart == 0) {
                skill.tsStart = Date.now();
                if (element != "total")
                    skill.startXP = PLAYER_INFO.skills[element].xp - xp.xp;
            }
        });
    }

    /* onmouseenter fill out tooltip with additional info */
    onmouseenter(event, callback_this) {
        if (!callback_this.isPluginEnabled) {
            return;
        }
        callback_this.tracking_skill = PLAYER_INFO.tracking_skill.id;
        let div = <HTMLElement>document.getElementById("skill_status_popup");
        let piSkill = PLAYER_INFO.skills[PLAYER_INFO.tracking_skill.id];
        let skill = callback_this.skillsList[PLAYER_INFO.tracking_skill.id];
        let xpRate = 0;
        let timeDiff = Date.now() - skill.tsStart;
        if (skill.tsStart != 0) {
            xpRate = Math.round((piSkill.xp - skill.startXP) / (timeDiff / 3600000) * 10) / 100;
        }
        let ttl = Math.round(piSkill.tnl / xpRate) / 10;
        div.innerHTML += `
            <div>XP per Action: ${Math.round(skill.avgActionXP * 10) / 100}</div>
            <div>Action TNL: ${skill.actionsToNext}</div>
            <div>XP per Hour: ${xpRate}</div>
            <div>Time To Level: ${ttl}</div>
            <div>Xp Tracked: ${skill.startXP == 0 ? 0 : ((piSkill.xp - skill.startXP) / 10).toLocaleString("en-US")}`;
    }

    /* clicking on a skill with shift will reset it
         ctrl-shift will reset them all
    */
    onmousedown(event, callback_this) {
        if (!callback_this.isPluginEnabled) {
            return;
        }
        if (event.shiftKey && event.ctrlKey) {
            callback_this.resetCalculatorAll(event);
        } else if (event.shiftKey) {
            let skill = callback_this.tracking_skill;
            callback_this.resetCalculator(skill, event);
        }
    }

    /* if tooltip is update just run onmouseenter() again */
    updateTooltip() {
        if (!this.isPluginEnabled) {
            return;
        }
        if (PLAYER_INFO.tracking && this.tracking_skill != "total") {
            this.onmouseenter(null, this);
        } else if (PLAYER_INFO.tracking && this.tracking_skill == "total") {
            this.totalLevelCalc(null, this);
        }
    }

    /* calculates tot exp on login */
    updateSkills() {
        if (!this.isPluginEnabled) {
            return;
        }
        if (this.skillsList.total.startXP != 0) //updateSkills sometimes runs additional times, I dont know why
            return;
        for (let i in this.skillsList) {
            if (i == "total")
                continue;
            this.skillsList.total.startXP += PLAYER_INFO.skills[i].xp;
        }
    }

    /* simple hook that runs this.onmouseenter() after the game function */
    installEventHook(eventBase, callback, callback_this) {
        let oldE = eventBase;
        if (typeof eventBase != 'function') // if event base isnt a function just set the callback
            return (event) => { callback(event, callback_this) };
        let newE = (event) => { oldE(event); callback(event, callback_this); };
        return newE;
    }

    /* format for the total xp tooltip
        may be called as an event callback or independantly
    */
    totalLevelCalc(event, callback_this) {
        if (!callback_this.isPluginEnabled)
            return;
        PLAYER_INFO.tracking = true;
        callback_this.tracking_skill = "total"
        let total = callback_this.skillsList.total;
        let div = document.getElementById("skill_status_popup");
        let xp = (total.startXP + total.gainedXP) / 10;
        let xpRate = 0;
        let timeDiff = Date.now() - total.tsStart;
        if (total.tsStart != 0) {
            xpRate = Math.round(total.gainedXP / (timeDiff / 3600000) * 10) / 100;
        }
        div.innerHTML = `
        <div>Total</div>
        <div>Current XP: ${xp.toLocaleString("en-US")}</div>
        <div>Gained XP: ${(total.gainedXP / 10).toLocaleString("en-US")}</div>
        <div>XP per Action: ${Math.round(total.avgActionXP * 10) / 100}</div>
        <div>XP per hour: ${xpRate}</div>
        `;
        if (event) { //if its an event update he poistion of the tooltip
            div.style.left = event.clientX + 15 + "px";
            div.style.top = event.clientY + 15 + "px";
            div.style.display = 'block';
        }
    }

    /* resets calculator without requiring a reload */
    resetCalculator(skill, event = null) {
        let temp = {
            numActions: 0,
            avgActionXP: 0,
            actionsToNext: 0,
            tsStart: 0,
            startXP: 0,
            gainedXP: 0
        }
        if (skill == "total") {
            delete temp.actionsToNext;
            let xp = this.skillsList.total.startXP + this.skillsList.total.gainedXP;
            this.skillsList.total = temp;
            this.skillsList.total.startXP = xp;
            this.skillsList.total.gainedXP = 0;
            this.totalLevelCalc(event, this);
            return;
        }
        delete temp.gainedXP;
        this.skillsList[skill] = temp;
        if (this.isHookInstalled)
            PLAYER_INFO.updateTooltip();
    }

    resetCalculatorAll(event = null) {
        for (let i in this.skillsList) {
            this.resetCalculator(i, event);
        }
    }
}

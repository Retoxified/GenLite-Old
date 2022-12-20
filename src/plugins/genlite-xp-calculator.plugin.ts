export class GenLiteXpCalculator {
    static pluginName = 'GenLiteXpCalculatorPlugin';

    skillsList;

    constructor() {

        this.skillsList = {
            vitality: {
                last10Inc: [],
                incIndex: 0,
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
        }

    }

    async init() {
        window.genlite.registerModule(this);
        /* copy over the datastructure in to each field */
        for (let i in this.skillsList) {
            this.skillsList[i] = structuredClone(this.skillsList.vitality);
        }
    }

    /* when an xp update comes calculate skillsList fields */
    updateXP(xp){
        let skill = this.skillsList[xp.skill];
        skill.last10Inc[skill.incIndex] = xp.xp;
        skill.incIndex++;
        if(skill.incIndex > 9)
            skill.incIndex = 0;
        skill.avgActionXP = 0;
        for (let i in skill.last10Inc){
            skill.avgActionXP += skill.last10Inc[i];
        }
        skill.avgActionXP /= skill.last10Inc.length;
        skill.actionsToNext = Math.ceil(PLAYER_INFO.skills[xp.skill].tnl / skill.avgActionXP);
        if (skill.tsStart == 0){
            skill.tsStart = Date.now();
            skill.startXP = PLAYER_INFO.skills[xp.skill].xp - xp.xp;
        }
    }

    /* onmouseenter fill out tooltip with additional info */
    onmouseenter(event, callback_this){
        let div = <HTMLElement> document.getElementById("skill_status_popup");
        let piSkill = PLAYER_INFO.skills[PLAYER_INFO.tracking_skill.id];
        let skill = callback_this.skillsList[PLAYER_INFO.tracking_skill.id];
        let xpRate = 0;
        let timeDiff = Date.now() - skill.tsStart;
        if(skill.tsStart != 0){
            xpRate = Math.round((piSkill.xp - skill.startXP) / (timeDiff / 3600000) * 10) / 100;
        }
        let ttl = Math.round(piSkill.tnl / xpRate) / 10;
        div.innerHTML += `
            <div>XP per Action: ${Math.round(skill.avgActionXP * 10) / 100}</div>
            <div>Action TNL: ${skill.actionsToNext}</div>
            <div>XP per hour: ${xpRate}</div>
            <div>Time To Level: ${ttl}</div>`;
    }

    /* if tooltip is update just run onmouseenter() again */
    updateTooltip(){
        if(PLAYER_INFO.tracking)
            this.onmouseenter(null, this);
    }

    /* we need the UI to be initalized before hooking */
    initializeUI(){
        let toolTipRoot = document.getElementsByClassName("new_ux-player-info-modal__modal__window--stats__skill__container");
        for(let i = 0; i < 18; i++){
            let tooltip = <HTMLElement> toolTipRoot[i];
            tooltip.onmouseenter = this.installEventHook(tooltip.onmouseenter, this.onmouseenter, this);
        }
    }

    /* simple hook that runs this.onmouseenter() after the game function */
    installEventHook(eventBase, callback, callback_this) {
        let oldE = eventBase;
        let newE = (event)=>{oldE(event); callback(event, callback_this);};
        return newE;
    }

    /* resets calculator without requiring a reload */
    resetCalculator(skill){
        this.skillsList[skill] = {
            last10Inc: [],
            incIndex: 0,
            avgActionXP: 0,
            actionsToNext: 0,
            tsStart: 0,
            startXP: 0
        }
    }

    resetCalculatorAll(){
        for (let i in this.skillsList){
            this.resetCalculator(i);
        }
    }
}

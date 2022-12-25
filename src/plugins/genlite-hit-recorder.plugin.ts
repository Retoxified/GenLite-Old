export class GenliteHitRecorder {
    static pluginName = 'GenliteHitRecorder';

    curEnemy;
    statsList;
    hitList;
    consecutiveZero;
    consecutiveNonZero;
    maxZero;
    maxNonZero;

    isPluginEnabled: boolean = false;

    constructor() {
        this.curEnemy = null;
        this.statsList = {
            aim: 0,
            power: 0,
            attack: 0,
            strength: 0,
            ranged: 0
        }
        this.hitList = {};
        this.consecutiveZero = 0;
        this.consecutiveNonZero = 0;

        this.maxZero = 0;
        this.maxNonZero = 0;
    }

    async init() {
        window.genlite.registerModule(this);
        this.isPluginEnabled = window.genlite.settings.add("HitRecorder.Enable", true, "Hit Recorder", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    handle(verb, payload) {
        if(this.isPluginEnabled === false) {
            return;
        }
        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {

            if (GAME.combats[payload.id].left.id != PLAYER.id) {
                this.curEnemy = GAME.combats[payload.id].left;
            } else {
                this.curEnemy = GAME.combats[payload.id].right;
            }
        }

        if (verb == "projectile" && payload.source == PLAYER.id) {
            this.curEnemy = GAME.npcs[payload.target];
        }

        /* for some reason npc.info doesnt contain health so grab it here and check for monster death */
        if (verb == "damage" && payload.id == this.curEnemy.id) {
            if(payload.amount == 0) {
                if(this.consecutiveNonZero > this.maxNonZero) {
                    this.maxNonZero = this.consecutiveNonZero;
                }
                this.consecutiveNonZero = 0;
                this.consecutiveZero++;
            } else {
                if(this.consecutiveZero > this.maxZero) {
                    this.maxZero = this.consecutiveZero;
                }
                this.consecutiveZero = 0;
                this.consecutiveNonZero++;
            }
            if(this.hitList[payload.amount] === undefined) {
                this.hitList[payload.amount] = 0;
            }
            this.hitList[payload.amount]++;
        }

        if (verb == "combatUI"){
            if( PLAYER_INFO !== undefined){
            this.statsList.attack = PLAYER_INFO.skills.attack.level;
            this.statsList.strength = PLAYER_INFO.skills.strength.level;
            this.statsList.ranged = PLAYER_INFO.skills.ranged.level;
            }
            this.statsList.aim = payload.equipment.stats.aim ?? payload.equipment.stats.ranged_aim;
            this.statsList.power = payload.equipment.stats.power ?? payload.equipment.stats.ranged_power;
            switch (payload.stance){
                case "controlled":
                    this.statsList.attack += 1;
                    this.statsList.strength += 1;
                    break;
                case "accurate":
                    this.statsList.attack += 3;
                    break;
                case "aggressive":
                    this.statsList.strength += 3;
                    break;
                case "ranged_offensive":
                    this.statsList.ranged += 3;
                    break;
                case "ranged_defensive":
                    this.statsList.ranged += 2;
            }
        }
    }

    initializeUI(){
        if(!this.isPluginEnabled){
            return;
        }
        this.statsList.attack = PLAYER_INFO.skills.attack.level;
        this.statsList.strength = PLAYER_INFO.skills.strength.level;
        this.statsList.ranged = PLAYER_INFO.skills.ranged.level;
    }

}
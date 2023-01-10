export class GenLiteWikiDataCollectionPlugin {
    static pluginName = 'GenLiteWikiDataCollectionPlugin';

    previously_seen = {};
    playerMeleeCL = 0;
    playerRangedCL = 0;
    combatStyle;

    curCombat = undefined;
    curEnemy = undefined;
    vitDrop = 0;

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.isPluginEnabled = window.genlite.settings.add(
            "WikiDataColl.Enable",
            false,
            "Wiki Data collection(REMOTE SERVER)",
            "checkbox",
            this.handlePluginEnableDisable,
            this,
            "Warning!\n"+ // Warning
            "Turning this setting on will send various pieces of data that benefit the wiki along with your IP\u00A0address to an external server.\n\n" +
            "Are you sure you want to enable this setting?"
        );
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    updateSkills(){
        this.playerMeleeCL = Math.trunc((PLAYER_INFO.skills.attack.level + PLAYER_INFO.skills.defense.level + PLAYER_INFO.skills.strength.level) / 3);
        this.playerRangedCL = PLAYER_INFO.skills.ranged.level;
    }

    combatUpdate(update) {
        if(!this.isPluginEnabled){
            return;
        }
        let object = GAME.objectById(update.id);

        if(update.id == PLAYER.id || GAME.players[update.id] !== undefined)
            return;

        if (!object || !object.object)
            return;

        let monsterdata = {
            "Monster_Name": object.info.name,
            "Monster_Level": object.info.level,
            "Monster_HP": update.maxhp,
            "Monster_Pack_ID": update.id.split("-")[0]
        };
        let mobKey = `${monsterdata.Monster_Name}-${monsterdata.Monster_Level}-${monsterdata.Monster_Pack_ID}`

        if(this.previously_seen[mobKey] === undefined)
        {
            this.previously_seen[mobKey] = monsterdata;
            window.genlite.sendDataToServer("monsterdata", monsterdata);
        }
    }

    handle(verb, payload){
        
        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {
            this.curCombat = GAME.combats[payload.id];
            if (this.curCombat.left.id != PLAYER.id) {
                this.curEnemy = this.curCombat.left;
            } else {
                this.curEnemy = this.curCombat.right;
            }
        }

        /* if ranging look for projectiles */
        if (verb == "projectile" && payload.source == PLAYER.id) {
            this.curEnemy = GAME.npcs[payload.target];
        }

        if(verb == "combatUI") {
            switch (payload.stance) {
                case "controlled":
                case "ranged_defensive":
                    this.combatStyle = "";
                    break;
                case "accurate":
                case "aggressive":
                case "defensive":
                    this.combatStyle = "melee"
                    break;
                case "ranged_offensive":
                    this.combatStyle = "ranged";
                    break;
            }
        }
    }

    updateXP(xp){
        console.log(xp);
        if(xp.levelUp){
            this.playerMeleeCL = Math.trunc((PLAYER_INFO.skills.attack.level + PLAYER_INFO.skills.defense.level + PLAYER_INFO.skills.strength.level) / 3);
            this.playerRangedCL = PLAYER_INFO.skills.ranged.level;
        }
        if(this.curEnemy === undefined)
            return;
        let mobKey = `${this.curEnemy.info.name}-${this.curEnemy.info.level}-${this.curEnemy.id.split("-")[0]}`
        if(xp.skill == "vitality"){
            this.vitDrop = xp.xp;
            return;
        }
        if(!["strength", "attack", "defense"].includes(xp.skill) || this.previously_seen[mobKey].baseXp !== undefined || this.combatStyle == ""){
            return;
        }
        let xpDrop = xp.xp + this.vitDrop;
        if (xpDrop % 3 != 0)
            xpDrop++;
        let levelDiff = (this.combatStyle == "melee" ? this.playerMeleeCL : this.playerRangedCL) - this.curEnemy.info.level;
        let baseXp;
        if (levelDiff == 0) {
            baseXp = xpDrop;
        } else if (levelDiff < 0){
            baseXp = xpDrop / (1 - ((1/20) * Math.max(levelDiff, -4)));
        } else {
            baseXp = xpDrop / (1 - ((7/120) * Math.min(levelDiff, 12)));
        }
        console.log(levelDiff);
        console.log(baseXp);
        //this.previously_seen[mobKey].baseXp = baseXp;
    }
}

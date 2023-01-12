export class GenLiteWikiDataCollectionPlugin {
    static pluginName = 'GenLiteWikiDataCollectionPlugin';

    previously_seen = {};
    playerMeleeCL = 0;
    playerRangedCL = 0;
    combatStyle = "";

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
            "Warning!\n" + // Warning
            "Turning this setting on will send various pieces of data that benefit the wiki along with your IP\u00A0address to an external server.\n\n" +
            "Are you sure you want to enable this setting?"
        );
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    updateSkills() {
        if (!this.isPluginEnabled) {
            return;
        }
        this.playerMeleeCL = Math.trunc((PLAYER_INFO.skills.attack.level + PLAYER_INFO.skills.defense.level + PLAYER_INFO.skills.strength.level) / 3);
        this.playerRangedCL = PLAYER_INFO.skills.ranged.level;
    }

    combatUpdate(update) {
        if (!this.isPluginEnabled) {
            return;
        }
        let object = GAME.objectById(update.id);

        if (update.id == PLAYER.id || GAME.players[update.id] !== undefined)
            return;

        if (!object || !object.object)
            return;

        let monsterdata = {
            "Monster_Name": object.info.name,
            "Monster_Level": object.info.level,
            "Monster_HP": update.maxhp,
            "Monster_Pack_ID": update.id.split("-")[0],
            "X": object.pos2.x,
            "Y": object.pos2.y,
            "Layer": PLAYER.location.layer
        };
        let mobKey = `${monsterdata.Monster_Name}-${monsterdata.Monster_Level}-${monsterdata.Monster_Pack_ID}`

        if (this.previously_seen[mobKey] === undefined) {
            this.previously_seen[mobKey] = monsterdata;
            window.genlite.sendDataToServer("monsterdata", monsterdata);
        }
    }

    handle(verb, payload) {
        if (!this.isPluginEnabled) {
            return;
        }

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

        if (verb == "combatUI") {
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

    updateXP(xp) {
        if (!this.isPluginEnabled) {
            return;
        }
        //console.log(xp);
        if (xp.levelUp) {
            this.playerMeleeCL = Math.trunc((PLAYER_INFO.skills.attack.level + PLAYER_INFO.skills.defense.level + PLAYER_INFO.skills.strength.level) / 3);
            this.playerRangedCL = PLAYER_INFO.skills.ranged.level;
        }
        if (this.curEnemy === undefined)
            return;
        let mobKey = `${this.curEnemy.info.name}-${this.curEnemy.info.level}-${this.curEnemy.id.split("-")[0]}`
        if (xp.skill == "vitality") {
            this.vitDrop = xp.xp;
            return;
        }
        if (!["strength", "attack", "defense"].includes(xp.skill) || this.previously_seen[mobKey].baseXp !== undefined || this.combatStyle == "")
            return;

        let xpDrop = xp.xp + this.vitDrop;
        // Hack? Math? i dunno i though i knew how this works but i dont but for some reason it increases the accuracy of the prediction
        switch (xpDrop % 3) {
            case 0:
                break;
            case 1:
                xpDrop++;
                break;
            case 2:
                xpDrop += 2
        }
        let levelDiff = (this.combatStyle == "melee" ? this.playerMeleeCL : this.playerRangedCL) - this.curEnemy.info.level;
        levelDiff = Math.min(Math.max(levelDiff,-4), 12);
        let baseXp;
        if (levelDiff == 0) {
            baseXp = xpDrop;
        } else if (levelDiff < 0) {
            baseXp = xpDrop / (1 - ((1 / 20) * levelDiff));
        } else {
            baseXp = xpDrop / (1 - ((7 / 120) * levelDiff));
        }
        this.previously_seen[mobKey].baseXp = baseXp;
        this.previously_seen[mobKey].levelDiffBit = 1<<(levelDiff+4);
        window.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
    }
}

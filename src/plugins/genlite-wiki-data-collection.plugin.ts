class MonsterData {
    //this needs to be moved to an interface once i figure out how TS interfaces work
    "Monster_Name" = "";
    "Monster_Level" = 0;
    "Monster_Pack_ID" = "";
    "X" = 0;
    "Y" = 0;
    "Layer" = "";
    "Pack_Size" = 0;
    "Monster_HP" = 0;
    "Base_Xp" = 0;
    "ign_mobkey" = "";
    "Level_Diff_Bit" = 0;
    "Version" = 3;
}

export class GenLiteWikiDataCollectionPlugin {
    static pluginName = 'GenLiteWikiDataCollectionPlugin';

    previously_seen = {};
    packList = {};
    toSend = [];
    playerMeleeCL = 0;
    playerRangedCL = 0;
    combatStyle = "";

    curCombat = undefined;
    curEnemy = undefined;
    vitDrop = 0;

    isPluginEnabled: boolean = false;
    scanInterval;
    sendInterval;

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

    loginOK() {
        this.scanNpcs(this);
        this.scanInterval = setInterval(() => { this.scanNpcs(this) }, 30000);
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
        let object = GAME.objectById(update.id);

        if (update.id == PLAYER.id || GAME.players[update.id] !== undefined)
            return;

        if (!object || !object.object)
            return;

        let packId = update.id.split("-")[0];
        let mobKey = this.packList[packId];
        if (mobKey === undefined)
            return;
        if (this.previously_seen[mobKey].Monster_HP == 0) { // if we havent seen the monster or if we dont know its health
            this.previously_seen[mobKey].Monster_HP = update.maxhp;
            if (this.isPluginEnabled)
                window.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
        }
    }

    handle(verb, payload) {

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
        if (xp.levelUp) {
            this.playerMeleeCL = Math.trunc((PLAYER_INFO.skills.attack.level + PLAYER_INFO.skills.defense.level + PLAYER_INFO.skills.strength.level) / 3);
            this.playerRangedCL = PLAYER_INFO.skills.ranged.level;
        }
        if (this.curEnemy === undefined)
            return;
        let mobKey = this.packList[this.curEnemy.id.split("-")[0]];
        if (xp.skill == "vitality") {
            this.vitDrop = xp.xp;
            return;
        }
        if (!["strength", "attack", "defense"].includes(xp.skill) || this.previously_seen[mobKey].baseXp !== undefined || this.combatStyle == "")
            return;

        let xpDrop = xp.xp + this.vitDrop;
        // ack? Math? i dunno i though i knew how this works but i dont but for some reason it increases the accuracy of the prediction
        xpDrop += (xpDrop % 3);
        let levelDiff = (this.combatStyle == "melee" ? this.playerMeleeCL : this.playerRangedCL) - this.curEnemy.info.level;
        levelDiff = Math.min(Math.max(levelDiff, -4), 12);
        let baseXp;
        if (levelDiff == 0) {
            baseXp = xpDrop;
        } else if (levelDiff < 0) {
            baseXp = xpDrop / (1 - ((1 / 20) * levelDiff));
        } else {
            baseXp = xpDrop / (1 - ((7 / 120) * levelDiff));
        }
        this.previously_seen[mobKey].Base_Xp = baseXp;
        this.previously_seen[mobKey].Level_Diff_Bit = 1 << (levelDiff + 4);
        if (this.isPluginEnabled)
            window.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
    }

    scanNpcs(callback_this) {
        let clustersize = 40
        let npcs = {}
        /* do some aggregrate stuff packSize, and add up mapsegment for averaging later */
        for (let key in GAME.npcs) {
            let packId = key.split('-')[0];
            if (npcs[packId] === undefined)
                npcs[packId] = { packSize: 0, mapSegX: 0, mapSegY: 0, npc: GAME.npcs[key] };
            npcs[packId].packSize++;
            npcs[packId].mapSegX += GAME.npcs[key].pos2.x / clustersize;
            npcs[packId].mapSegY += GAME.npcs[key].pos2.y / clustersize;
        }
        /* calculate the mob key check if we need to update the server */
        for (let packId in npcs) {
            let npcInfo = npcs[packId];
            // finish calculating the map segment by averaging the aggragate location
            npcInfo.mapSegX = Math.round(npcInfo.mapSegX / npcInfo.packSize);
            npcInfo.mapSegY = Math.round(npcInfo.mapSegY / npcInfo.packSize);
            let group = 'A';
            let npc = npcs[packId].npc;
            /* calculate the mob key and increment the group if the key conflicts with a prexisting entry */
            let mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${PLAYER.location.layer}:${npcInfo.mapSegX}-${npcInfo.mapSegY}-${group}`;
            while (this.previously_seen[mobKey] !== undefined && this.previously_seen[mobKey].ign_mobkey != packId) {
                group = String.fromCharCode(group.charCodeAt(0) + 1);
                mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${PLAYER.location.layer}:${npcInfo.mapSegX}-${npcInfo.mapSegY}-${group}`;
            }
            /* if we have an existing key just ignore the above */
            mobKey = this.packList[packId] ? this.packList[packId] : mobKey;
            if (this.previously_seen[mobKey] !== undefined) {
                if (!this.previously_seen[mobKey].Pack_Size ||
                    this.previously_seen[mobKey].Pack_Size < npcInfo.packSize) { // if we have seen it before but we counted more this time update

                    let monsterdata = this.previously_seen[mobKey];
                    monsterdata.Pack_Size = npcInfo.packSize;
                    if (this.isPluginEnabled)
                        window.genlite.sendDataToServer("monsterdata", monsterdata);
                }
                continue;
            }
            let monsterdata = {
                "Monster_Name": npc.info.name,
                "Monster_Level": npc.info.level ? npc.info.level : 0,
                "Monster_Pack_ID": mobKey,
                "X": npcInfo.mapSegX * clustersize,
                "Y": npcInfo.mapSegY * clustersize,
                "Layer": PLAYER.location.layer,
                "Pack_Size": npcInfo.packSize,
                "Monster_HP": 0,
                "Base_Xp": 0,
                "ign_mobkey": packId,
                "Level_Diff_Bit": 0,
                "Version": 3
            };
            this.previously_seen[mobKey] = monsterdata;
            this.packList[packId] = mobKey;
            if (this.isPluginEnabled)
                this.toSend.push(monsterdata);
        }
        /*
                // spread the server messages over a 20 second interval to lessen server stress
                if (callback_this.toSend.length > 0)
                    callback_this.sendTimeInterval = setInterval(() => { callback_this.sendToServer(callback_this) }, 20000 / callback_this.toSend.length)
                    */
    }

    sendToServer(callback_this) {
        let monsterdata = callback_this.toSend.pop();
        window.genlite.sendDataToServer("monsterdata", monsterdata);
        if (callback_this.toSend.length == 0)
            clearInterval(callback_this.sendTimeInterval);
    }
}

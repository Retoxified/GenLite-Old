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

    isRemoteEnabled: boolean = false;
    scanInterval;
    sendInterval;

    async init() {
        window.genlite.registerModule(this);

        this.isRemoteEnabled = window.genlite.settings.add(
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
        this.scanNpcs();
        this.scanInterval = setInterval(() => { this.scanNpcs() }, 1000);
        // send out a monsterdata once every 1s to lesson server load
            //if (this.isRemoteEnabled)
                //this.sendInterval = setInterval(() => { this.sendToServer(this) }, 1000);
    }

    logoutOK(){
        clearInterval(this.scanInterval);
        clearInterval(this.sendInterval)
    }

    handlePluginEnableDisable(state: boolean) {
        this.isRemoteEnabled = state;
        if(state) {
            this.sendInterval = setInterval(() => { this.sendToServer(this) }, 200);
        } else {
            clearInterval(this.sendInterval);
        }
    }

    updateSkills() {
        if (!this.isRemoteEnabled) {
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
            if (this.isRemoteEnabled)
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
        levelDiff = Math.min(Math.max(levelDiff, -4), 9);
        let baseXp;
        if (levelDiff == 0) {
            baseXp = xpDrop;
        } else if (levelDiff < 0) {
            baseXp = xpDrop / (1 - ((1 / 20) * levelDiff));
        } else {
            baseXp = xpDrop / (1 - ((1 / 10) * levelDiff));
        }
        this.previously_seen[mobKey].Base_Xp = baseXp;
        this.previously_seen[mobKey].Level_Diff_Bit = 1 << (levelDiff + 4);
        if (this.isRemoteEnabled)
            window.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
    }

    scanNpcs() {
        let clustersize = 40
        let npcs = {}
        let blackList = [];
        /* do some aggregrate stuff packSize, and add up mapsegment for averaging later */
        for (let key in GAME.npcs) {
            let npc = GAME.npcs[key];
            let npcX = npc.pos2.x;
            let npcY = npc.pos2.y;
            let packId = key.split('-')[0];
            /* if any member of the pack is above 30 tiles away ignore it because there might be more memeber out of range */
            if (Math.abs(npcX - PLAYER.character.pos2.x) > 30 || Math.abs(npcY - PLAYER.character.pos2.y) > 30 || blackList.includes(packId)){
                delete npcs[packId]
                blackList.push(packId)
                continue;
            }
            if (npcs[packId] === undefined)
                npcs[packId] = { packSize: 0, mapSegX: 0, mapSegY: 0, npc: npc };
            npcs[packId].packSize++;
            npcs[packId].mapSegX += npcX
            npcs[packId].mapSegY += npcY
        }
        /* calculate the mob key check if we need to update the server */
        for (let packId in npcs) {
            let npcInfo = npcs[packId];
            // finish calculating the map segment by averaging the aggragate location
            let mapSegX = Math.round((npcInfo.mapSegX / clustersize) / npcInfo.packSize);
            let mapSegY = Math.round((npcInfo.mapSegY / clustersize) / npcInfo.packSize);
            let group = 'A';
            let npc = npcs[packId].npc;
            /* calculate the mob key and increment the group if the key conflicts with a prexisting entry */
            let mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${npcInfo.packSize}--${PLAYER.location.layer}:${mapSegX}:${mapSegY}-${group}`;
            while (this.previously_seen[mobKey] !== undefined && this.previously_seen[mobKey].ign_mobkey != packId) {
                group = String.fromCharCode(group.charCodeAt(0) + 1);
                mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${npcInfo.packSize}--${PLAYER.location.layer}:${mapSegX}:${mapSegY}-${group}`;
            }

            if (this.previously_seen[mobKey] !== undefined) {
                if (this.previously_seen[mobKey].numSeen == 100)
                    this.toSend.push(this.previously_seen[mobKey]);
                this.previously_seen[mobKey].numSeen++;
                continue;
            }

            let monsterdata = {
                "Monster_Name": npc.info.name,
                "Monster_Level": npc.info.level ? npc.info.level : 0,
                "Monster_Pack_ID": mobKey,
                "X": npcInfo.mapSegX / npcInfo.packSize,
                "Y": npcInfo.mapSegY / npcInfo.packSize,
                "Layer": PLAYER.location.layer,
                "Pack_Size": npcInfo.packSize,
                "Monster_HP": 0,
                "Base_Xp": 0,
                "Level_Diff_Bit": 0,
                "ign_mobkey": packId,
                "numSeen": 1,
                "Version": 4
            };
            this.previously_seen[mobKey] = monsterdata;
            if (!this.packList[packId])
                this.packList[packId] = mobKey;
            if (this.previously_seen[this.packList[packId]].Pack_Size < monsterdata.Pack_Size) {
                delete this.previously_seen[this.packList[packId]];
                this.packList[packId] = mobKey;
            }
        }
    }

    sendToServer(callback_this) {
        if(callback_this.toSend.length <= 0)
            return;
        let monsterdata = callback_this.toSend.pop();
        window.genlite.sendDataToServer("monsterdata", monsterdata);
    }
}

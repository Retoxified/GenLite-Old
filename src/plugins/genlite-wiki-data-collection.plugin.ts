/*
    Copyright (C) 2022-2023 Retoxified, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteWikiDataCollectionPlugin extends GenLitePlugin {
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
    scanInterval: NodeJS.Timer = null;
    sendInterval: NodeJS.Timer = null;

    async init() {
        document.genlite.registerPlugin(this);
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Wiki Data Collection", null, this.handlePluginState.bind(this), {}, true, "Warning: This plugin will send data to the wiki (a third party). Only enable this plugin if you trust the wiki.");
    }

    handlePluginState(state: boolean): void {
        this.isRemoteEnabled = state;
        if (state) {
            this.sendInterval = setInterval(() => { this.sendToServer(this) }, 200);
        } else {
            clearInterval(this.sendInterval);
        }
    }

    loginOK() {
        this.scanNpcs();
        if (this.scanInterval == null)
            this.scanInterval = setInterval(() => { this.scanNpcs() }, 1000);
        // send out a monsterdata once every 1s to lesson server load
        if (this.isRemoteEnabled && this.sendInterval == null)
            this.sendInterval = setInterval(() => { this.sendToServer(this) }, 1000);
    }

    Network_logoutOK() {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
        clearInterval(this.sendInterval);
        this.sendInterval = null;
    }

    PlayerInfo_updateSkills() {
        if (!this.isRemoteEnabled) {
            return;
        }
        this.playerMeleeCL = Math.trunc((
            document.game.PLAYER_INFO.skills.attack.level +
            document.game.PLAYER_INFO.skills.defense.level +
            document.game.PLAYER_INFO.skills.strength.level
        ) / 3);
        this.playerRangedCL = document.game.PLAYER_INFO.skills.ranged.level;
    }

    Game_combatUpdate(update) {
        let object = document.game.GAME.objectById(update.id);

        if (update.id == document.game.PLAYER.id || document.game.GAME.players[update.id] !== undefined)
            return;

        if (!object || !object.object)
            return;

        let packId = update.id.split("-")[0];
        let mobKey = this.packList[packId];
        if (mobKey === undefined)
            return;
        if (this.previously_seen[mobKey].Monster_HP == 0) { // if we havent seen the monster or if we dont know its health
            this.previously_seen[mobKey].Monster_HP = update.maxhp;
            if (this.isRemoteEnabled && this.previously_seen[mobKey].numSeen >= 100)
                document.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
        }
    }

    Network_handle(verb, payload) {

        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == document.game.PLAYER.id || payload.participant2 == document.game.PLAYER.id)) {
            this.curCombat = document.game.GAME.combats[payload.id];
            if (this.curCombat.left.id != document.game.PLAYER.id) {
                this.curEnemy = this.curCombat.left;
            } else {
                this.curEnemy = this.curCombat.right;
            }
        }

        /* if ranging look for projectiles */
        if (verb == "projectile" && payload.source == document.game.PLAYER.id) {
            this.curEnemy = document.game.GAME.npcs[payload.target];
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

    PlayerInfo_updateXP(xp) {
        if (xp.levelUp) {
            this.playerMeleeCL = Math.trunc((document.game.PLAYER_INFO.skills.attack.level + document.game.PLAYER_INFO.skills.defense.level + document.game.PLAYER_INFO.skills.strength.level) / 3);
            this.playerRangedCL = document.game.PLAYER_INFO.skills.ranged.level;
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
        let levelDiff = (this.combatStyle == "melee" ? this.playerMeleeCL : this.playerRangedCL) - this.curEnemy.info.level;
        let baseXp;
        if (levelDiff == 0) {
            baseXp = xpDrop;
        } else if (levelDiff == -4) {
            baseXp = xpDrop / 1.2;
        } else if (levelDiff == 9) {
            baseXp = xpDrop / 0.1;
        }
        this.previously_seen[mobKey].Base_Xp = baseXp;
        this.previously_seen[mobKey].Level_Diff_Bit = 0;
        if (this.isRemoteEnabled && this.previously_seen[mobKey].numSeen >= 100)
            document.genlite.sendDataToServer("monsterdata", this.previously_seen[mobKey]);
    }

    scanNpcs() {
        let clustersize = 40
        let npcs = {}
        let blackList = [];
        /* do some aggregrate stuff packSize, and add up mapsegment for averaging later */
        for (let key in document.game.GAME.npcs) {
            let npc = document.game.GAME.npcs[key];
            let npcX = npc.pos2.x;
            let npcY = npc.pos2.y;
            let packId = key.split('-')[0];
            /* if any member of the pack is above 30 tiles away ignore it because there might be more memeber out of range */
            if (Math.abs(npcX - document.game.PLAYER.character.pos2.x) > 30 || Math.abs(npcY - document.game.PLAYER.character.pos2.y) > 30 || blackList.includes(packId)) {
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
            let mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${npcInfo.packSize}--${document.game.PLAYER.location.layer}:${mapSegX}:${mapSegY}-${group}`;
            while (this.previously_seen[mobKey] !== undefined && this.previously_seen[mobKey].ign_mobkey != packId) {
                group = String.fromCharCode(group.charCodeAt(0) + 1);
                mobKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}--${npcInfo.packSize}--${document.game.PLAYER.location.layer}:${mapSegX}:${mapSegY}-${group}`;
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
                "Layer": document.game.PLAYER.location.layer,
                "Pack_Size": npcInfo.packSize,
                "Monster_HP": 0,
                "Base_Xp": 0,
                "Level_Diff_Bit": 0,
                "ign_mobkey": packId,
                "numSeen": 1,
                "Version": 4
            };
            /* if scanned pack is smaller ignore it and continue */
            if (this.previously_seen[this.packList[packId]] && this.previously_seen[this.packList[packId]].Pack_Size > monsterdata.Pack_Size)
                continue;
            /* store key */
            this.previously_seen[mobKey] = monsterdata;
            /* if pack list not set, link packId and genKey */
            if (!this.packList[packId])
                this.packList[packId] = mobKey;
            /* if packId key is smaller than genKey delete old and set new */
            if (this.previously_seen[this.packList[packId]].Pack_Size < monsterdata.Pack_Size) {
                delete this.previously_seen[this.packList[packId]];
                this.packList[packId] = mobKey;
            }
        }
    }

    sendToServer(callback_this) {
        if (callback_this.toSend.length <= 0)
            return;
        let monsterdata = callback_this.toSend.pop();
        document.genlite.sendDataToServer("monsterdata", monsterdata);
    }
}

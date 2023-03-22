/*
    Copyright (C) 2022-2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteDropRecorderPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteDropRecorderPlugin';

    monsterData = {
        Monster_Name: "",
        Monster_Level: 0,
        packID: "",
        layer: "",
        x: 0,
        y: 0,
        Version: 2,

        Drops: []
    };
    curCombat: { [key: string]: any } = undefined;
    curEnemy = {
        id: "",
        pos2: { x: 0, y: 0 },
        info: { name: "", level: 0 }
    };
    enemyDead: Number = Number.POSITIVE_INFINITY;
    objectSpawns = [];

    /* key for dropTable -> Monster_Name-Monster_Level */
    dropTable = {};

    packList;

    isPluginEnabled: boolean = false;
    submitItemsToServer: boolean = false;

    pluginSettings = {
        checkbox: {
            label: "Send Drops to Wiki",
            type: "checkbox",
            value: this.submitItemsToServer,
            handler: this.handleSubmitToServer
        }
    };
            

    async init() {
        document.genlite.registerPlugin(this);
        document.genlite.ui.registerPlugin("Drop Recorder", this.handlePluginEnableDisable, this.pluginSettings, this);

        let dropTableString = localStorage.getItem("genliteDropTable");
        if (dropTableString == null) {
            this.dropTable = {};
        } else {
            this.dropTable = JSON.parse(dropTableString);
        }
    }

    async postInit() {
        this.packList = document['GenLiteWikiDataCollectionPlugin'].packList;
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;

    }

    handleSubmitToServer(state: boolean) {
        this.submitItemsToServer = state;
    }

    handle(verb: string, payload: { [key: string]: any }) {
        if (this.isPluginEnabled === false || document.game.NETWORK.loggedIn === false) {
            return;
        }

        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == document.game.PLAYER.id || payload.participant2 == document.game.PLAYER.id)) {

            this.curCombat = document.game.GAME.combats[payload.id];
            this.curEnemy = this.curCombat.left.id == document.game.PLAYER.id ? this.curCombat.right : this.curCombat.left;
            this.setMonsterData();
            return;
        }

        /* if ranging look for projectiles */
        if (verb == "projectile" && payload.source == document.game.PLAYER.id) {
            this.curEnemy = document.game.GAME.npcs[payload.target];
            this.setMonsterData();
            return;
        }

        /* set enemy dead on seeing vitality,
            this is the tightest reliable window I can find for timestamps */
        if (verb == "xp" && payload.skill == "vitality") {
            this.enemyDead = payload.timestamp;
            return;
        }

        /* in the interval between monster death and object removal record spawnObject
            if the items are on a square one tile around the mob
            NOTE: this assumes removeObject comes last which might not be true across updates
        */
        if (verb == "spawnObject" && payload.type == "item" && this.enemyDead != Number.POSITIVE_INFINITY) {
            if (this.curEnemy.pos2 === undefined)
                return;

            let itemX: Number = payload.location.position.x;
            let itemY: Number = payload.location.position.y;
            let enemyX: Number[] = [this.curEnemy.pos2.x, this.curEnemy.pos2.x + 1, this.curEnemy.pos2.x - 1];
            let enemyY: Number[] = [this.curEnemy.pos2.y, this.curEnemy.pos2.y + 1, this.curEnemy.pos2.y - 1];
            if (enemyX.includes(itemX) && enemyY.includes(itemY))
                this.objectSpawns.push(payload);
            return;
        }

        /* when npc is removed look for drops at same timestamp could be a false positive
            if two npcs die exactly at the same time but this should be like a once in a universe event
            then send data to server and record in local dropTable
        */
        if (verb == "removeObject" && payload.id == this.curEnemy.id && this.enemyDead != Number.POSITIVE_INFINITY) {
            let drop: any = {};
            this.monsterData.Drops = [];
            for (let item in this.objectSpawns) {
                if (this.objectSpawns[item].timestamp <= payload.timestamp && this.objectSpawns[item].timestamp >= this.enemyDead) {
                    drop.Item_Code = this.objectSpawns[item].item.item;
                    drop.Item_Quantity = this.objectSpawns[item].item.quantity === undefined ? drop.Item_Quantity = 1 : this.objectSpawns[item].item.quantity;
                    this.monsterData.Drops.push(structuredClone(drop));
                }
            }

            /* if no drops are detected create a "nothing" drop and add that */
            if (this.monsterData.Drops.length == 0) {
                drop.Item_Code = "nothing";
                drop.Item_Quantity = 1;
                this.monsterData.Drops.push(structuredClone(drop));
            }
            this.objectSpawns = [];
            this.enemyDead = Number.POSITIVE_INFINITY;
            if (this.submitItemsToServer === true)
                document.genlite.sendDataToServer("droplogproject", this.monsterData);

            this.localDropRecording();
            return;
        }
    }
    /* on login scan for combats as some times you can spawn in to a combat
    */
    loginOK() {
        for (let i in document.game.GAME.combats) {
            let combat = document.game.GAME.combats[i];
            if (combat.left.id == document.game.PLAYER.id) {
                this.curCombat = combat;
                this.curEnemy = combat.right;
            } else if (combat.right.id == document.game.PLAYER.id) {
                this.curCombat = combat;
                this.curEnemy = combat.left;
            }
            break;
        }
        if (this.curCombat !== undefined)
            this.setMonsterData();
    }

    setMonsterData() {
        this.monsterData.layer = this.monsterData.layer = document.game.PLAYER.location.layer
        this.monsterData.x = this.curEnemy.pos2.x;
        this.monsterData.y = this.curEnemy.pos2.y;
        this.monsterData.Monster_Name = this.curEnemy.info.name;
        this.monsterData.Monster_Level = this.curEnemy.info.level ? this.curEnemy.info.level : 0;
        this.monsterData.packID = this.packList[this.curEnemy.id.split('-')[0]];
    }

    /* record and aggregate drops in local storage */
    localDropRecording() {
        let dropKey = String.prototype.concat(this.monsterData.Monster_Name, "-", this.monsterData.Monster_Level.toString());
        if (this.dropTable[dropKey] === undefined) {
            this.dropTable[dropKey] = {};
            this.dropTable[dropKey].Monster_Name = this.monsterData.Monster_Name;
            this.dropTable[dropKey].Monster_Level = this.monsterData.Monster_Level;
            this.dropTable[dropKey].Num_Killed = 0;
            this.dropTable[dropKey].location = [];
            this.dropTable[dropKey].drops = {};
        }
        this.dropTable[dropKey].Num_Killed++;
        this.dropTable[dropKey].location.push({
            layer: this.monsterData.layer,
            x: this.monsterData.x,
            y: this.monsterData.y
        });
        for (let i in this.monsterData.Drops) {
            let drop = this.monsterData.Drops[i]
            if (this.dropTable[dropKey].drops[drop.Item_Code] === undefined)
                this.dropTable[dropKey].drops[drop.Item_Code] = 0;
            this.dropTable[dropKey].drops[drop.Item_Code] += drop.Item_Quantity;
            localStorage.setItem("genliteDropTable", JSON.stringify(this.dropTable));
        }
    }
}

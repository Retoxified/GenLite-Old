// ==UserScript==
// @name         GenLite Drop Recorder
// @namespace    GenLite
// @version      0.1.1
// @description  try to take over the world!
// @author       dpe#0175
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==
(function() {
    class GenliteDropRecorder {
        constructor() {

            /* json format for an indvidual monster */
            this.monsterData = {
                Monster_Name: undefined,
                Monster_Level: 0,
                hp: 0,
                layer: undefined,
                x: 0,
                y: 0,

                Drops: []
            };
            this.curCombat = undefined;
            this.curEnemy = { id: undefined }; //to prevent an undefined error down the line
            this.enemyDead = 0;
            this.objectSpawns = [];

            /* key for dropTable -> Monster_Name-Monster_Level */
            this.dropTable = {};
        }

        init() {
            window.genlite.registerModule(this);
            this.dropTable = JSON.parse(localStorage.getItem("genliteDropTable"));
            if(this.dropTable == null)
                this.dropTable = {};
        }

        handle(verb, payload) {
            /* look for start of combat set the curEnemy and record data */
            if (verb == "spawnObject" && payload.type == "combat" &&
                (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {

                this.monsterData.layer = payload.location.position.layer;
                this.monsterData.x = payload.location.position.x;
                this.monsterData.y = payload.location.position.y;
                this.curCombat = GAME.combats[payload.id];
                if (this.curCombat.left.id != PLAYER.id) {
                    this.curEnemy = this.curCombat.left;
                } else {
                    this.curEnemy = this.curCombat.right;
                }
                this.monsterData.Monster_Name = this.curEnemy.info.name;
                this.monsterData.Monster_Level = this.curEnemy.info.level;
            }

            /* if ranging look for projectiles */
            if (verb == "projectile" && payload.source == PLAYER.id) {
                this.curEnemy = GAME.npcs[payload.target];
                this.monsterData.layer = PLAYER.location.layer; //pos2 layer isnt always defined so use PLAYER
                this.monsterData.x = this.curEnemy.pos2.x;
                this.monsterData.y = this.curEnemy.pos2.y;
                this.monsterData.Monster_Name = this.curEnemy.info.name;
                this.monsterData.Monster_Level = this.curEnemy.info.level;
            }

            /* for some reason npc.info doesnt contain health so grab it here and check for monster death */
            if (verb == "damage" && payload.id == this.curEnemy.id) {
                this.monsterData.Monster_HP = payload.maxhp;
                if (payload.hp <= 0) {
                    this.enemyDead = payload.timestamp;
                }
            }

            /* in the inverval between monster dead and object removal record spawnObject
                NOTE: this assumes removeObject comes last which might not be true across updates
            */
            if (verb == "spawnObject" && payload.type == "item" && this.enemyDead != 0) {
                this.objectSpawns.push(payload);
            }

            /* when npc is removed look for drops at same timestamp could be a false positive
                if two npcs die exactly at the same time but this should be like a once in a universe event
                then send data to server and record in local dropTable
            */
            if (verb == "removeObject" && payload.id == this.curEnemy.id) {
                let drop = {};
                this.monsterData.Drops = [];
                for (let item in this.objectSpawns) {
                    if (this.objectSpawns[item].timestamp <= payload.timestamp) {
                        drop.Item_Code = this.objectSpawns[item].item.item;
                        if (this.objectSpawns[item].item.quantity === undefined) {
                            drop.Item_Quantity = 1;
                        } else {
                            drop.Item_Quantity = this.objectSpawns[item].item.quantity;
                        }
                        this.monsterData.Drops.push(structuredClone(drop));
                    }
                }

                /* if no drops are detected create a "nothing" drop and add that */
                if(this.monsterData.Drops.length == 0){
                    drop.Item_Code = "nothing";
                    drop.Item_Quantity = 1;
                    this.monsterData.Drops.push(structuredClone(drop));
                }
                this.objectSpawns = [];
                this.enemyDead = 0;
                this.sendDataToServer("droplogproject", this.monsterData);
                this.localDropRecording();
            }
        }

        /* record and aggregate drops in local storage */
        localDropRecording() {
            let dropKey = String.prototype.concat(this.monsterData.Monster_Name, "-", this.monsterData.Monster_Level);
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
            for(let i in this.monsterData.Drops){
                let drop = this.monsterData.Drops[i]
                if (this.dropTable[dropKey].drops[drop.Item_Code] === undefined)
                    this.dropTable[dropKey].drops[drop.Item_Code] = 0;
                this.dropTable[dropKey].drops[drop.Item_Code] += drop.Item_Quantity;
                localStorage.setItem("genliteDropTable", JSON.stringify(this.dropTable));
            }
        }

        sendDataToServer(url, data) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", `https://nextgensoftware.nl/${url}.php`);
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(data));
        }
    }


    window.GenliteDropRecorder = new GenliteDropRecorder();

    let gameLoadTimer = setInterval(function() {
        try {
            if (window.genlite !== undefined) {
                window.GenliteDropRecorder.init();
                clearInterval(gameLoadTimer);
            }
        } catch (e) {}
    }, 1000);
})();

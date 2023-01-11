export class GenliteDropRecorderPlugin {
    static pluginName = 'GenLiteDropRecorderPlugin';

    monsterData = {
        Monster_Name: undefined,
        Monster_Level: 0,
        packID: "",
        layer: undefined,
        x: 0,
        y: 0,

        Drops: []
    };
    curCombat = undefined;
    curEnemy = {
        id: "",
        pos2: { x: 0, y: 0 },
        info: { name: "", level: 0 }
    };
    enemyDead = Number.POSITIVE_INFINITY;
    objectSpawns = [];

    /* key for dropTable -> Monster_Name-Monster_Level */
    dropTable = {};

    /* for special mob packs that have the same name and level but different drops 
        for now this needs to be detected and added manually
    */
    static specialMobs = {
        "world:ns127": "tent"
    }

    isPluginEnabled: boolean = false;
    submitItemsToServer: boolean = false;

    async init() {
        window.genlite.registerModule(this);
        let dropTableString = localStorage.getItem("genliteDropTable")
        if (dropTableString == null) {
            this.dropTable = {};
        } else {
            this.dropTable = JSON.parse(dropTableString);
        }
        this.isPluginEnabled = window.genlite.settings.add("DropRecorder.Enable", true, "Drop Recorder", "checkbox", this.handlePluginEnableDisable, this);
        this.submitItemsToServer = window.genlite.settings.add(
            "DropRecorder.SubmitToServer", // Key
            false,                         // Default
            "Send Drops to Server(REMOTE SERVER)", // Name in UI
            "checkbox", // Type
            this.handleSubmitToServer, // handler function
            this,  // context for handler
            "Warning!\n" + // Warning
            "Turning this setting on will send monster drop data along with your IP\u00A0address to an external server.\n\n" +
            "Are you sure you want to enable this setting?"
        );
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    handleSubmitToServer(state: boolean) {
        this.submitItemsToServer = state;
    }

    handle(verb, payload) {
        if (this.isPluginEnabled === false || NETWORK.loggedIn === false) {
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
            this.setMonsterData();
            return;
        }

        /* if ranging look for projectiles */
        if (verb == "projectile" && payload.source == PLAYER.id) {
            this.curEnemy = GAME.npcs[payload.target];
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
            if (this.curEnemy.pos2 === undefined) {
                return;
            }
            let itemX = payload.location.position.x;
            let itemY = payload.location.position.y;
            let enemyX: number[] = [this.curEnemy.pos2.x, this.curEnemy.pos2.x + 1, this.curEnemy.pos2.x - 1];
            let enemyY: number[] = [this.curEnemy.pos2.y, this.curEnemy.pos2.y + 1, this.curEnemy.pos2.y - 1];
            if (enemyX.includes(itemX) && enemyY.includes(itemY)) {
                this.objectSpawns.push(payload);
            }
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
                    if (this.objectSpawns[item].item.quantity === undefined) {
                        drop.Item_Quantity = 1;
                    } else {
                        drop.Item_Quantity = this.objectSpawns[item].item.quantity;
                    }
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
            if (this.submitItemsToServer === true) {
                window.genlite.sendDataToServer("droplogproject", this.monsterData);
            }
            this.localDropRecording();
            return;
        }
    }
    /* on login scan for combats as some times you can spawn in to a combat
    */
    loginOK() {
        for (let i in GAME.combats) {
            let combat = GAME.combats[i];
            if (combat.left.id == PLAYER.id) {
                this.curCombat = combat;
                this.curEnemy = combat.right;
            } else if (combat.right.id == PLAYER.id) {
                this.curCombat = combat;
                this.curEnemy = combat.left;
            }
            break;
        }
        if (this.curCombat === undefined)
            return;
        this.setMonsterData();
    }

    setMonsterData() {
        this.monsterData.layer = this.monsterData.layer = PLAYER.location.layer
        this.monsterData.x = this.curEnemy.pos2.x;
        this.monsterData.y = this.curEnemy.pos2.y;
        this.monsterData.Monster_Name = this.curEnemy.info.name;
        this.monsterData.Monster_Level = this.curEnemy.info.level;
        this.monsterData.packID = this.curEnemy.id.split('-')[0];
    }

    /* record and aggregate drops in local storage */
    localDropRecording() {
        let dropKey = String.prototype.concat(this.monsterData.Monster_Name, "-", this.monsterData.Monster_Level.toString());
        if (Object.keys(GenliteDropRecorderPlugin.specialMobs).includes(this.monsterData.packID))
            dropKey.concat("-", GenliteDropRecorderPlugin.specialMobs[this.monsterData.packID]);
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

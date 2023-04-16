/*
    Copyright (C) 2022-2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

type SortType = 'kills'|'kills-inv'|'alpha'|'alpha-inv';

export class GenLiteDropRecorderPlugin extends GenLitePlugin {
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

    uiTab: HTMLElement = null;
    listContainer: HTMLElement = null;
    monsterElements: Record<string, HTMLElement> = {};
    sortMethod : SortType = 'kills';
    sortOrder : Array<SortType> = ['kills', 'alpha'];
    sortIcon : HTMLElement = null;

    pluginSettings : Settings = {
        "Send Drops to Wiki": {
            type: "checkbox",
            oldKey: "GenLite.DropRecorder.SubmitToServer",
            value: this.submitItemsToServer,
            stateHandler: this.handleSubmitToServer.bind(this),
            alert: "This will send your drops to the wiki (a third party), please only enable this if you are comfortable with this."
        }
    };
            
    async init() {
        document.genlite.registerPlugin(this);
        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));

        let dropTableString = localStorage.getItem("genliteDropTable");
        if (dropTableString == null) {
            this.dropTable = {};
        } else {
            this.dropTable = JSON.parse(dropTableString);
        }
        for(let key in this.dropTable){
            if(this.dropTable[key].location)
                delete (this.dropTable[key].location);
        }
    }

    async postInit() {
        this.packList = document['GenLiteWikiDataCollectionPlugin'].packList;
        this.createCSS();
        this.createUITab();
        document.genlite.ui.registerPlugin("Drop Recorder", "GenLite.DropRecorder.Enable", this.handlePluginState.bind(this), this.pluginSettings);
    }

    createCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            .genlite-drops-container {
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
                color: #ffd593;
                font-family: acme,times new roman,Times,serif;
                height: 100%;
            }

            .genlite-drops-search-row {
                width: 100%;
                height: 25px;
                border-bottom: 1px solid rgb(66, 66, 66);
                display: flex;
                align-items: center;
            }

            .genlite-drops-search {
                background-color: rgb(42, 40, 40);
                color: rgb(255, 255, 255);
                font-size: 16px;
                border-radius: 0px;
                padding-left: 10px;
                padding-right: 10px;
                box-sizing: border-box;
                outline: none;
                width: 100%;
                border: medium none;
                margin-left: auto;
                margin-right: auto
            }

            .genlite-drops-sort-icon {
                height: 100%;
                padding-right: 0.5em;
                color: white;
                cursor: pointer;
            }

            .genlite-drops-list {
                display: flex;
                flex-direction: column;
                overflow-y: scroll;
                height: 100%;
            }

            .genlite-drops-row {
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
                border-bottom: 1px solid rgb(66, 66, 66);
                border-top: 1px solid rgb(0, 0, 0);
            }

            .genlite-drops-header {
                display: flex;
                column-gap: 0.5em;
                padding: 0.25em;
                overflow-x: hidden;
                align-items: center;
                position: relative;
            }

            .genlite-drops-iconlist {
                display: flex;
                column-gap: 0.5em;
                padding: 0.25em;
                overflow-x: hidden;
            }

            .genlite-drops-arrow {
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .genlite-drops-arrow i {
                margin: auto;
                flex-shrink: 0;
            }

            .genlite-drops-title {
                flex-grow: 1;
            }

            .genlite-drops-trash {
                display: none;
                position: absolute;
                right: 0;
                color: red;
                padding-right: 1em;
                cursor: pointer;
                top: 50%;
                transform: translateY(-50%);
                z-index: 2;
            }

            .genlite-drops-icon {
                width: 28px;
                height: 28px;
                position: relative;
            }

            .genlite-drops-output {
                display: none;
                flex-direction: column;
                padding-left: 1em;
                flex-direction: column;
                background-color: rgb(33, 33, 33);
                margin-left: 1em;
                margin-right: 1em;
                margin-bottom: 1em;
                border-bottom-left-radius: 1em;
                padding: 1em;
                border-bottom-right-radius: 1em;
                box-shadow: -2px 2px rgb(30,30,30);
            }

            .genlite-drops-output-row {
                display: flex;
                column-gap: 1em;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
    }

    createUITab() {
        if (this.uiTab) {
            this.uiTab.remove();
        }

        let settingsMenu = <HTMLElement>document.createElement("div");
        settingsMenu.classList.add("genlite-drops-container");

        // search bar
        let searchrow = <HTMLElement>document.createElement("div");
        searchrow.classList.add("genlite-drops-search-row");
        settingsMenu.appendChild(searchrow);

        let search = <HTMLInputElement>document.createElement("input");
        searchrow.appendChild(search);
        search.classList.add("genlite-drops-search");
        search.placeholder = "Search Drops...";
        search.type = "text";

        let iconDiv = <HTMLElement>document.createElement("div");
        iconDiv.classList.add("genlite-drops-sort-icon");
        iconDiv.innerHTML = '<i class="fas fa-arrow-down-9-1"></i>';
        searchrow.appendChild(iconDiv);
        this.sortIcon = iconDiv;

        iconDiv.onclick = (e) => {
            document['GenLiteDropRecorderPlugin'].changeSort();
        }

        search.onfocus = () => {
            document.game.CHAT.focus_locked = true;
        }

        search.onblur = () => {
            document.game.CHAT.focus_locked = false;
        }

        search.oninput = function (e) {
            let value = search.value.trim().toLowerCase();
            let values = [];
            for (const v of value.split(",")) {
                values.push(v.trim());
            }

            let rows = document.getElementsByClassName("genlite-drops-row");
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i] as HTMLElement;
                let content = row.innerHTML.toLowerCase();
                if (value === "") {
                    row.style.removeProperty("display");
                    continue;
                }

                let match = true;
                for (let v of values) {
                    let invert = v[0] === "-";
                    if (invert) {
                        v = v.substr(1);
                    }

                    if (!invert && !content.includes(v)) {
                        match = false;
                        break;
                    } else if (invert && content.includes(v)) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    row.style.removeProperty("display");
                } else {
                    row.style.display = "none";
                }
            }
        }

        // monster list
        this.listContainer = <HTMLElement>document.createElement("div");
        this.listContainer.classList.add("genlite-drops-list");
        settingsMenu.appendChild(this.listContainer);
        this.refreshDropsUI();

        this.uiTab = document.genlite.ui.addTab("skull", "Drop Recorder", settingsMenu, this.isPluginEnabled);
    }

    changeSort() {
        let i = (this.sortOrder.indexOf(this.sortMethod) + 1) % this.sortOrder.length;
        this.sortMethod = this.sortOrder[i];
        let div = this.sortIcon;
        switch (this.sortMethod) {
            case 'kills':
                div.innerHTML = '<i class="fas fa-arrow-down-9-1"></i>';
                break;
            case 'kills-inv':
                div.innerHTML = '<i class="fas fa-arrow-up-9-1"></i>';
                break;
            case 'alpha':
                div.innerHTML = '<i class="fas fa-arrow-down-a-z"></i>';
                break;
            case 'alpha-inv':
                div.innerHTML = '<i class="fas fa-arrow-up-z-a"></i>';
                break;
        }
        this.refreshDropsUI();
    }

    refreshDropsUI() {
        let entries : any = Object.entries(this.dropTable);
        let sorted : Array<any> = [];
        switch (this.sortMethod) {
            case 'kills':
                sorted = entries.sort(
                    ([,a],[,b]) =>
                    b.Num_Killed - a.Num_Killed
                );
                break;
            case 'kills-inv':
                sorted = entries.sort(
                    ([,a],[,b]) =>
                    a.Num_Killed - b.Num_Killed
                );
                break;
            case 'alpha':
                sorted = entries.sort(
                    ([,a],[,b]) =>
                    a.Monster_Name.localeCompare(b.Monster_Name)
                );
                break;
            case 'alpha-inv':
                sorted = entries.sort(
                    ([,a],[,b]) =>
                    b.Monster_Name.localeCompare(a.Monster_Name)
                );
                break;
        }

        this.listContainer.innerHTML = '';
        for (const entry of sorted) {
            const monsterId = entry[0];
            let row = this.monsterElements[monsterId];
            if (row) {
                this.listContainer.appendChild(this.monsterElements[monsterId]);
            } else {
                this.createMonsterRow(monsterId);
            }
        }
    }

    createMonsterRow(monsterId: string) {
        const data = this.dropTable[monsterId];

        let row = <HTMLElement>document.createElement("div");
        row.classList.add("genlite-drops-row");
        this.listContainer.appendChild(row);

        this.monsterElements[monsterId] = row;

        let header = <HTMLElement>document.createElement("div");
        header.classList.add("genlite-drops-header");
        row.appendChild(header);

        let arrow = <HTMLElement>document.createElement("div");
        arrow.classList.add("genlite-drops-arrow");
        let i = <HTMLElement>document.createElement("i");
        i.classList.add("fa-chevron-right");
        i.classList.add("fas");
        arrow.appendChild(i);
        header.appendChild(arrow);

        let title = <HTMLElement>document.createElement("div");
        title.classList.add("genlite-drops-title");
        title.innerText = this.getUITitle(data);
        header.appendChild(title);

        let trash = <HTMLElement>document.createElement("div");
        trash.classList.add("genlite-drops-trash");
        trash.innerHTML = '<i class="fas fa-trash"></i>';
        header.appendChild(trash);
        trash.onclick = (e) => {
            let plugin = document['GenLiteDropRecorderPlugin'];
            plugin.deleteDropEntry(monsterId);
            plugin.monsterElements[monsterId].remove();
            delete plugin.monsterElements[monsterId];
        };

        let outputBox = <HTMLElement>document.createElement("div");
        outputBox.classList.add("genlite-drops-output");
        row.appendChild(outputBox);

        this.updateOutputBox(outputBox, data);

        arrow.onclick = function (e) {
            if (i.classList.toggle("fa-chevron-right")) {
                i.classList.remove("fa-chevron-down");
                outputBox.style.display = "none";
            } else {
                i.classList.add("fa-chevron-down");
                outputBox.style.display = "flex";
            }
        }
    }

    createIconDiv(item) {
        let div = <HTMLImageElement>document.createElement("div");
        div.classList.add("genlite-drops-icon");

        let icon = <HTMLImageElement>document.createElement("img");
        icon.classList.add("genlite-drops-icon");
        icon.title = item;
        div.appendChild(icon);

        const itemdata = document.game.DATA.items[item];
        if (itemdata) {
            if (itemdata.name) {
                icon.title = itemdata.name;
            }

            if (itemdata.image) {
                icon.src = document.game.getStaticPath('items/' + itemdata.image);
            } else if (itemdata.images) {
                let image = itemdata.images[itemdata.images.length - 1][1];
                icon.src = document.game.getStaticPath('items/' + image);
            }

            if (itemdata.border) {
                let path = `items/placeholders/${ itemdata.border }_border.png`;
                path = document.game.getStaticPath(path);
                let qual = <HTMLImageElement>document.createElement("img");
                qual.classList.add("new_ux-inventory_quality-image");
                qual.src = path;
                div.appendChild(qual);
            }
        }

        if (!icon.src) {
            icon.src = document.game.getStaticPath('items/unknown.png');
        }
        return div;
    }

    getUITitle(data) {
        return `Lv ${data.Monster_Level} ${data.Monster_Name} (${data.Num_Killed} killed)`;
    }

    updateOutputBox(outputBox: HTMLElement, data) {
        let seo = `mob:${data.Monster_Name};`;

        function addSEO(prefix, s) {
            seo += prefix + s;
            seo += prefix + s
                .replace("L.Q.", "LQ")
                .replace("H.Q.", "HQ")
                .replace("Bronze Component (", "")
                .replace("Iron Component (", "")
                .replace("Steel Component (", "")
                .replace("Mithril Component (", "");
            if (!s.includes("L.Q.") && !s.includes("H.Q.")) {
                seo += prefix + "N.Q. " + s;
                seo += prefix + "NQ " + s;
            }
        }

        // update header w/ number killed, blame kkona for this hack
        let es = outputBox.parentElement.getElementsByClassName('genlite-drops-title');
        if (es.length) {
            (es[0] as HTMLElement).innerText = this.getUITitle(data);
        }

        outputBox.innerHTML = '';

        let sorted = Object.entries(data.drops).sort(([,a],[,b]) => (b as number) - (a as number))
        for (const entry of sorted) {
            let item = entry[0];

            let orow = <HTMLElement>document.createElement("div");
            orow.classList.add("genlite-drops-output-row");

            let icon = this.createIconDiv(item);
            orow.appendChild(icon);

            let seoitem = item + ";";
            const itemdata = document.game.DATA.items[item];
            if (itemdata && itemdata.name) {
                seoitem = itemdata.name + ";";
            }
            addSEO("drop:", seoitem);

            let n = data.drops[item];
            let pct = (n / data.Num_Killed * 100);
            pct = Math.round(pct * 100) / 100;
            orow.appendChild(document.createTextNode(`${n} (${pct}%)`));
            outputBox.appendChild(orow);
        }

        let seospan = <HTMLElement>document.createElement("span");
        seospan.style.display = "none";
        seospan.innerText = seo;
        outputBox.appendChild(seospan);
    }

    updateMonsterRow(monsterId: string) {
        let row = this.monsterElements[monsterId];
        if (!row) {
            this.createMonsterRow(monsterId);
        } else {
            let data = this.dropTable[monsterId];
            let es = row.getElementsByClassName('genlite-drops-output');
            if (es) {
                let outputBox = <HTMLElement>es[0];
                this.updateOutputBox(outputBox, data);
            }
        }
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        if (this.uiTab) {
            this.uiTab.style.display = state ? "flex" : "none";
        }
    }

    handleSubmitToServer(state: boolean) {
        this.submitItemsToServer = state;
    }

    Network_handle(verb: string, payload: { [key: string]: any }) {
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
            //this.dropTable[dropKey].location = [];
            this.dropTable[dropKey].drops = {};
        }
        this.dropTable[dropKey].Num_Killed++;
        /*
        this.dropTable[dropKey].location.push({
            layer: this.monsterData.layer,
            x: this.monsterData.x,
            y: this.monsterData.y
        });
        */
        for (let i in this.monsterData.Drops) {
            let drop = this.monsterData.Drops[i]
            if (this.dropTable[dropKey].drops[drop.Item_Code] === undefined)
                this.dropTable[dropKey].drops[drop.Item_Code] = 0;
            this.dropTable[dropKey].drops[drop.Item_Code] += drop.Item_Quantity;
            localStorage.setItem("genliteDropTable", JSON.stringify(this.dropTable));
        }
        this.updateMonsterRow(dropKey);
    }

    deleteDropEntry(key: string) {
        let deletedStr = localStorage['genliteDeletedDrops'];
        if (!deletedStr) {
            deletedStr = '[]';
        }
        let deleted = JSON.parse(deletedStr ? deletedStr : '[]');
        deleted.push({
            key: key,
            time: Date.now(),
            data: this.dropTable[key],
        });
        localStorage.setItem("genliteDeletedDrops", JSON.stringify(deleted));
        delete this.dropTable[key];
        localStorage.setItem("genliteDropTable", JSON.stringify(this.dropTable));
    }

    keyDownHandler(event) {
        if (event.key !== "Alt")
            return;

        event.preventDefault();
        if (!event.repeat) {
            let eles = document.getElementsByClassName('genlite-drops-trash');
            for (let i = 0; i < eles.length; i++) {
                let el = eles[i] as HTMLElement;
                el.style.display = 'flex';
            }
        }
    }

    keyUpHandler(event) {
        if (event.key !== "Alt")
            return;

        event.preventDefault();
        let eles = document.getElementsByClassName('genlite-drops-trash');
        for (let i = 0; i < eles.length; i++) {
            let el = eles[i] as HTMLElement;
            el.style.removeProperty('display');
        }
    }
}

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

export class GenLiteRecipeRecorderPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteRecipeRecorderPlugin';

    isCrafting = false;
    recipe;
    recipeName = "";
    prevInventory;
    prevVerb;
    swapped_inv = false;

    isGathering = false;
    gatherTask = "";
    gatherNode = "";

    recipeResults = {};
    gatherResults = {};

    isPluginEnabled: boolean = false;

    uiTab: HTMLElement = null;
    listContainer: HTMLElement = null;
    recipeElements: Record<string, HTMLElement> = {};

    async init() {
        document.genlite.registerPlugin(this);

        let dropTableString = localStorage.getItem("GenliteRecipeRecorder")
        if (dropTableString == null) {
            this.recipeResults = {};
            this.gatherResults = {};
        } else {
            let saved = JSON.parse(dropTableString);
            this.recipeResults = saved.recipe ? saved.recipe : {};
            this.gatherResults = saved.gathering ? saved.gathering : {};
        }

        this.createCSS();
        this.createUITab();
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Recipe Recorder", null, this.handlePluginState.bind(this));
    }

    createCSS() {
        const style = document.createElement('style');
        // chrome is dumb so we need to specify this scrollbar thing
        style.innerHTML = `
            .genlite-recipes-container *::-webkit-scrollbar-track {
                background-color: transparent;
            }

            .genlite-recipes-container {
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
                color: #ffd593;
                font-family: acme,times new roman,Times,serif;
                row-gap: 1em;
                padding: 1em;
                height: 100%;
            }

            .genlite-recipes-list {
                display: flex;
                flex-direction: column;
                row-gap: 1em;
                overflow-y: scroll;
                height: 80%;
            }

            .genlite-recipes-row {
                display: flex;
                flex-direction: column;
                background-color: #0e0c0b;
                padding: 0.25em;
                flex-shrink: 0;
            }

            .genlite-recipes-iconlist {
                display: flex;
                column-gap: 0.5em;
                padding: 0.25em;
                overflow-x: scroll;
            }

            .genlite-recipes-arrow {
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .genlite-recipes-arrow i {
                margin: auto;
            }

            .genlite-recipes-icon {
                width: 28px;
                height: 28px;
                position: relative;
            }

            .genlite-recipes-output {
                display: none;
                flex-direction: column;
            }

            .genlite-recipes-output-row {
                display: flex;
                column-gap: 1em;
            }

            .genlite-recipes-search {
            }
        `;
        document.head.appendChild(style);
    }

    createUITab() {
        if (this.uiTab) {
            this.uiTab.remove();
        }

        let settingsMenu = <HTMLElement>document.createElement("div");
        settingsMenu.classList.add("genlite-recipes-container");

        // search bar
        let search = <HTMLInputElement>document.createElement("input");
        settingsMenu.appendChild(search);
        search.classList.add("genlite-recipes-search");
        search.type = "text";

        search.oninput = function (e) {
            let value = search.value.trim();
            let list = document.getElementsByClassName("genlite-recipes-row");
            for (let i = 0; i < list.length; i++) {
                let row = list[i] as HTMLElement;
                let content = row.innerHTML.toLowerCase();
                if (value === "") {
                    row.style.removeProperty("display");
                } else if (content.includes(value)) {
                    row.style.removeProperty("display");
                } else {
                    row.style.display = "none";
                }
            }
        };

        // recipe list
        this.listContainer = <HTMLElement>document.createElement("div");
        this.listContainer.classList.add("genlite-recipes-list");
        settingsMenu.appendChild(this.listContainer);
        for (const recipeName in this.recipeResults) {
            this.createRecipeRow(recipeName);
        }

        this.uiTab = document.genlite.ui.addTab("kitchen-set", "Recipe Recorder", settingsMenu, this.isPluginEnabled);
    }

    createRecipeRow(recipeName: string) {
        const result = this.recipeResults[recipeName];

        let row = <HTMLElement>document.createElement("div");
        row.classList.add("genlite-recipes-row");
        this.listContainer.appendChild(row);

        this.recipeElements[recipeName] = row;

        // inputs
        let icons = <HTMLElement>document.createElement("div");
        icons.classList.add("genlite-recipes-iconlist");
        row.appendChild(icons);

        let arrow = <HTMLElement>document.createElement("div");
        arrow.classList.add("genlite-recipes-arrow");
        let i = <HTMLElement>document.createElement("i");
        i.classList.add("fa-chevron-right");
        i.classList.add("fas");
        arrow.appendChild(i);
        icons.appendChild(arrow);

        let nInputs = 0;
        for (const item in result.input) {
            nInputs = result.input[item]; // TODO: make sure input #s are always equal
            let div = <HTMLImageElement>document.createElement("div");
            div.classList.add("genlite-recipes-icon");
            icons.appendChild(div);

            let icon = <HTMLImageElement>document.createElement("img");
            icon.classList.add("genlite-recipes-icon");
            icon.title = item;
            div.appendChild(icon);

            const itemdata = document.game.DATA.items[item];
            if (itemdata && itemdata.image && itemdata.name) {
                icon.title = itemdata.name;
                icon.src = document.game.getStaticPath('items/' + itemdata.image);

                if (itemdata.border) {
                    let path = `items/placeholders/${ itemdata.border }_border.png`;
                    path = document.game.getStaticPath(path);
                    let qual = <HTMLImageElement>document.createElement("img");
                    qual.classList.add("new_ux-inventory_quality-image");
                    qual.src = path;
                    div.appendChild(qual);
                }
            }
        }

        // now draw outputs
        let outputBox = <HTMLElement>document.createElement("div");
        outputBox.classList.add("genlite-recipes-output");
        row.appendChild(outputBox);

        this.updateOutputBox(outputBox, result);

        arrow.onclick = function (e) {
            if (i.classList.toggle("fa-chevron-right")) {
                i.classList.remove("fa-chevron-down");
                outputBox.style.display = "none";
            } else {
                i.classList.add("fa-chevron-down");
                outputBox.style.display = "flex";
            }
        };
    }

    updateOutputBox(outputBox: HTMLElement, results) {
        let nInputs = 0;
        for (const item in results.input) {
            nInputs = results.input[item];
            break;
        }

        outputBox.innerHTML = '';
        outputBox.appendChild(document.createTextNode(`${nInputs} tries`));

        for (const item in results.output) {
            let orow = <HTMLElement>document.createElement("div");
            orow.classList.add("genlite-recipes-output-row");

            let div = <HTMLImageElement>document.createElement("div");
            div.classList.add("genlite-recipes-icon");
            orow.appendChild(div);

            let icon = <HTMLImageElement>document.createElement("img");
            icon.classList.add("genlite-recipes-icon");
            icon.title = item;
            div.appendChild(icon);

            const itemdata = document.game.DATA.items[item];
            if (itemdata && itemdata.image && itemdata.name) {
                icon.title = itemdata.name;
                icon.src = document.game.getStaticPath('items/' + itemdata.image);

                if (itemdata.border) {
                    let path = `items/placeholders/${ itemdata.border }_border.png`;
                    path = document.game.getStaticPath(path);
                    let qual = <HTMLImageElement>document.createElement("img");
                    qual.classList.add("new_ux-inventory_quality-image");
                    qual.src = path;
                    div.appendChild(qual);
                }
            }

            let n = results.output[item];
            let pct = (n / nInputs * 100);
            pct = Math.round(pct * 100) / 100;
            orow.appendChild(document.createTextNode(`${n} (${pct}%)`));

            outputBox.appendChild(orow);
        }
    }

    updateRecipeRow(recipeName: string) {
        let row = this.recipeElements[recipeName];
        if (!row) {
            this.createRecipeRow(recipeName);
        } else {
            let results = this.recipeResults[recipeName];
            let es = row.getElementsByClassName('genlite-recipes-output');
            if (es) {
                let outputBox = <HTMLElement>es[0];
                this.updateOutputBox(outputBox, results);
            }
        }
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        if (this.uiTab) {
            this.uiTab.style.display = state ? "flex" : "none";
        }
    }

    Network_logoutOK() {
        this.isCrafting = false;
        this.isGathering = false;
    }

    Network_action(verb, params) {
        if (this.isPluginEnabled === false) {
            return;
        }
        if (params.hasOwnProperty('action')) {
            if (params.action.hasOwnProperty('recipe')) {
                this.isCrafting = true;
                this.isGathering = false;
                this.recipe = params.action.recipe;
                this.prevInventory = document.game.INVENTORY.items;
                this.recipeName = params.action.recipe;
                let mats;
                if (params.action.params) {
                    mats = Object.keys(params.action.params);
                    mats = mats.sort();
                    for (let i of mats) // if params is set here then record a complex recipe name
                        this.recipeName = this.recipeName.concat("__", i, params.action.params[i]);
                }
                if (this.recipeResults[this.recipeName] === undefined)
                    this.recipeResults[this.recipeName] = {
                        input: {},
                        output: {}
                    };
                return;
            }

            switch (params.action) {
                case "Mine":
                    this.gatherTask = "mining";
                    break;
                case "Chop down":
                    this.gatherTask = "logging";
                    break;
                case "Harvest":
                    this.gatherTask = "botany";
                    break;
                default:
                    this.gatherTask = "";
                    break;
            }
            if (this.gatherTask !== "") {
                this.isGathering = true;
                this.isCrafting = false;
                this.gatherNode = params.id;
                this.prevInventory = document.game.INVENTORY.items;
            } else {
                this.isGathering = false;
                this.isCrafting = false;
            }
            return;
        }

        if (verb == "inventory_swap") {
            this.swapped_inv = true;
            return;
        }

        /* if we get here check the white listed (non interupting) verbs and return otherwise set crafting and gathering to false */
        let whitelistverbs = ["request_sync", "p", "chat_private", "change_combat_stance", "conversation", "load_complete"];
        if (whitelistverbs.includes(verb)) {
            return;
        }
        this.isGathering = false;
        this.isCrafting = false;
    }

    Network_handle(verb, payload) {
        if (this.isPluginEnabled === false) {
            return;
        }

        let itemList = {};
        /* TODO? I dont like relying on NETWORK message orders
            but after filtering I have never seen them come in a different one
        */
        if (!(this.isCrafting || this.isGathering))
            return;
        if (verb == 'inventory') {
            if (this.swapped_inv) {
                this.swapped_inv = false;
                return;
            }
            for (let i in this.prevInventory) {
                /* add up the quantities of the inventory */
                if (itemList[this.prevInventory[i].item] === undefined)
                    itemList[this.prevInventory[i].item] = 0;

                if (this.prevInventory[i].quantity === undefined) {
                    itemList[this.prevInventory[i].item] += 1;
                } else {
                    itemList[this.prevInventory[i].item] += this.prevInventory[i].quantity;
                }
            }

            /* subtract the new inventory */
            for (let i in payload) {
                if (itemList[payload[i].item] === undefined)
                    itemList[payload[i].item] = 0;

                if (payload[i].quantity === undefined) {
                    itemList[payload[i].item] -= 1;
                } else {
                    itemList[payload[i].item] -= payload[i].quantity;
                }
            }

            if (this.isCrafting) {
                this.storeRecipeData(itemList);
            } else if (this.isGathering) {
                this.storeGatherData(itemList);
            }
            this.prevInventory = structuredClone(payload);
            localStorage.setItem("GenliteRecipeRecorder", JSON.stringify({ recipe: this.recipeResults, gathering: this.gatherResults }));
            /* determines if crafting is done by looking for the stop animation
                that comes only after the crafting animation
            */
        } else if (verb == "action" && payload.type.match("fail")) {
            if (this.gatherResults[this.gatherTask] === undefined)
                this.gatherResults[this.gatherTask] = {};
            let gather = this.gatherResults[this.gatherTask];
            let nodeKey = document.game.GRAPHICS.scene.allObjects[this.gatherNode].modelInfo.nick;
            if (gather[nodeKey] === undefined)
                gather[nodeKey] = {};
            let node = gather[nodeKey];
            if (node["nothing"] == undefined)
                node["nothing"] = 0;
            node["nothing"]++;
            localStorage.setItem("GenliteRecipeRecorder", JSON.stringify({ recipe: this.recipeResults, gathering: this.gatherResults }));
        }
        this.prevVerb = verb;
    }

    storeRecipeData(itemList) {
        /* negative values are outputs
            positive are inputs
        */
        let isNothing = true;
        for (let i in itemList) {
            if (i == "undefined")
                continue;

            if (itemList[i] < 0) {
                if (this.recipeResults[this.recipeName].output[i] === undefined)
                    this.recipeResults[this.recipeName].output[i] = 0;
                this.recipeResults[this.recipeName].output[i] -= itemList[i];
                isNothing = false;
            } else if (itemList[i] > 0) {
                if (this.recipeResults[this.recipeName].input[i] === undefined)
                    this.recipeResults[this.recipeName].input[i] = 0;
                this.recipeResults[this.recipeName].input[i] += itemList[i];
            }
        }
        if (isNothing) {
            if (this.recipeResults[this.recipeName].output["nothing"] === undefined)
                this.recipeResults[this.recipeName].output["nothing"] = 0;
            this.recipeResults[this.recipeName].output["nothing"]++;
        }

        this.updateRecipeRow(this.recipeName);
    }

    storeGatherData(itemList) {
        if (this.gatherResults[this.gatherTask] === undefined)
            this.gatherResults[this.gatherTask] = {};
        let gather = this.gatherResults[this.gatherTask];
        let nodeKey = document.game.GRAPHICS.scene.allObjects[this.gatherNode].modelInfo.impl.params;
        if (gather[nodeKey] === undefined)
            gather[nodeKey] = {};
        let node = gather[nodeKey];
        for (let i in itemList) {
            if (i == "undefined")
                continue;
            if (itemList[i] < 0) {
                if (node[i] === undefined)
                    node[i] = 0;
                node[i] -= itemList[i];
            }
        }

    }

    resetResultsList() {
        this.recipeResults = {};
        this.gatherResults = {};
        localStorage.removeItem("GenliteRecipeRecorder");
    }
}

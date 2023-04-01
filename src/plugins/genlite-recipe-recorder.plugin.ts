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

export class GenLiteRecipeRecorderPlugin implements GenLitePlugin {
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
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Recipe Recorder", null, this.handlePluginState.bind(this));
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
    }

    logoutOK() {
        this.isCrafting = false;
        this.isGathering = false;
    }

    action(verb, params) {
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

    handle(verb, payload) {
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

export class GenLiteRecipeRecorderPlugin {
    static pluginName = 'GenLiteRecipeRecorderPlugin';

    isCrafting = false;
    recipe;
    recipeName = "";
    prevInventory;
    prevVerb;
    stTime = 0;

    isGathering = false;
    gatherTask = "";
    gatherNode = "";

    recipeResults = {};
    gatherResults = {};

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);
        let dropTableString = localStorage.getItem("GenliteRecipeRecorder")
        if (dropTableString == null) {
            this.recipeResults = {};
            this.gatherResults = {};
        } else {
            let saved = JSON.parse(dropTableString);
            this.recipeResults = saved.recipe;
            this.gatherResults = saved.gathering;
        }
        this.isPluginEnabled = window.genlite.settings.add("RecipeRecorder.Enable", true, "Record Recipes", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    action(verb, params) {
        if (this.isPluginEnabled === false) {
            return;
        }
        console.log(verb, params);

        if (params.hasOwnProperty('action')) {
            if (params.action.hasOwnProperty('recipe')) {
                this.isCrafting = true;
                this.recipe = params.action.recipe;
                this.prevInventory = INVENTORY.items;
                this.recipeName = params.action.recipe;
                for (let i in params.action.params) // if params is set here then record a complex recipe name
                    this.recipeName = this.recipeName.concat("__", i, params.action.params[i]);
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
                this.gatherNode = params.id;
                this.prevInventory = INVENTORY.items;
            }
        }
        if (verb == "walk") {
            this.isGathering = false;
        }
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
        } else if (verb == 'animation' && payload.player == PLAYER.id) {
            if (payload.anim) {
                this.stTime = payload.timestamp;
            } else if (this.stTime < payload.timestamp && this.stTime != 0) {
                this.isCrafting = false;
                this.isGathering = false;
                this.stTime = 0;
            }
        } else if (verb == "action" && payload.type.match("fail")) {
            if (this.gatherResults[this.gatherTask] === undefined)
                this.gatherResults[this.gatherTask] = {};
            let gather = this.gatherResults[this.gatherTask];
            let nodeKey = GRAPHICS.scene.allObjects[this.gatherNode].modelInfo.nick;
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
        let nodeKey = GRAPHICS.scene.allObjects[this.gatherNode].modelInfo.impl.params;
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

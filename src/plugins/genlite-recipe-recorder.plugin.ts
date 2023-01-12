export class GenLiteRecipeRecorderPlugin {
    static pluginName = 'GenLiteRecipeRecorderPlugin';

    crafting;

    isPluginEnabled: boolean = false;

    constructor() {

        /* stores state needed for recording crafting */
        this.crafting = {
            isCrafting: false,
            recipe: undefined,
            recipeName: undefined,
            prevInventory: undefined,
            prevVerb: undefined,
            stTime: 0,

            resultsList: {}
        };

    }

    async init() {
        window.genlite.registerModule(this);
        let dropTableString = localStorage.getItem("GenliteRecipeRecorder")
        if (dropTableString == null) {
            this.crafting.resultsList = {};
        } else {
            this.crafting.resultsList = JSON.parse(dropTableString);
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

        if (params.hasOwnProperty('action')) {
            if (params.action.hasOwnProperty('recipe')) {
                this.crafting.isCrafting = true;
                this.crafting.recipe = params.action.recipe;
                this.crafting.prevInventory = INVENTORY.items;
                this.crafting.recipeName = params.action.recipe;
                for (let i in params.action.params) // if params is set here then record a complex recipe name
                    this.crafting.recipeName = this.crafting.recipeName.concat("__", i, params.action.params[i]);
                if (this.crafting.resultsList[this.crafting.recipeName] === undefined)
                    this.crafting.resultsList[this.crafting.recipeName] = {
                        input: {},
                        output: {}
                    };
            }
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
        if (!this.crafting.isCrafting)
            return;
        if (verb == 'inventory') {
            for (let i in this.crafting.prevInventory) {
                /* add up the quantities of the inventory */
                if (itemList[this.crafting.prevInventory[i].item] === undefined)
                    itemList[this.crafting.prevInventory[i].item] = 0;

                if (this.crafting.prevInventory[i].quantity === undefined) {
                    itemList[this.crafting.prevInventory[i].item] += 1;
                } else {
                    itemList[this.crafting.prevInventory[i].item] += this.crafting.prevInventory[i].quantity;
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

            /* negative values are outputs
                positive are inputs
            */
            let isNothing = true;
            for (let i in itemList) {
                if (itemList[i] < 0) {
                    if (this.crafting.resultsList[this.crafting.recipeName].output[i] === undefined)
                        this.crafting.resultsList[this.crafting.recipeName].output[i] = 0;
                    this.crafting.resultsList[this.crafting.recipeName].output[i] -= itemList[i];
                    isNothing = false;
                } else if (itemList[i] > 0) {
                    if (this.crafting.resultsList[this.crafting.recipeName].input[i] === undefined)
                        this.crafting.resultsList[this.crafting.recipeName].input[i] = 0;
                    this.crafting.resultsList[this.crafting.recipeName].input[i] += itemList[i];
                }
            }
            if (isNothing) {
                if (this.crafting.resultsList[this.crafting.recipeName].output["nothing"] === undefined)
                    this.crafting.resultsList[this.crafting.recipeName].output["nothing"] = 0;
                this.crafting.resultsList[this.crafting.recipeName].output["nothing"]++;
            }
            this.crafting.prevInventory = structuredClone(payload);
            localStorage.setItem("GenliteRecipeRecorder", JSON.stringify(this.crafting.resultsList));
            /* determines if crafting is done by looking for the stop animation
                that comes only after the crafting animation
            */
        } else if (verb == 'animation' && payload.player == PLAYER.id) {
            if (payload.anim) {
                this.crafting.stTime = payload.timestamp;
            } else if (this.crafting.stTime < payload.timestamp && this.crafting.stTime != 0) {
                this.crafting.isCrafting = false;
                this.crafting.stTime = 0;
            }
        }
        this.crafting.prevVerb = verb;
    }

    resetResultsList() {
        this.crafting.resultsList = {};
        localStorage.removeItem("GenliteRecipeRecorder");
    }
}

/*
    Copyright (C) 2022-2023 KKonaOG
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/


import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteEnhancedContextMenu implements GenLitePlugin {
    static pluginName = 'GenLiteEnhancedContextMenu';

    wikiBaseURL: string = "https://genfanad.fandom.com/wiki/";
    isEnabled: boolean = false;

    hideStairs: boolean = false;
    lookupNPCs: boolean = false;
    lookupObjects: boolean = false;
    lookupItems: boolean = false;
    betterRockNames: boolean = false;

    originalInventoryContextOptions: Function;
    originalNPCIntersects: Function;
    originalSceneIntersects: Function;

    intersect_vector = new document.game.THREE.Vector3();

    pluginSettings: Settings = {
        "Hide Stairs": {
            type: 'checkbox',
            value: this.hideStairs,
            stateHandler: this.handleHideStairsToggle.bind(this)
        },
        "Lookup on NPCs": {
            type: 'checkbox',
            value: this.lookupNPCs,
            stateHandler: this.handleLookupNPCsToggle.bind(this)
        },
        "Lookup on Objects": {
            type: 'checkbox',
            value: this.lookupObjects,
            stateHandler: this.handleLookupObjectsToggle.bind(this)
        },
        "Lookup on Items": {
            type: 'checkbox',
            value: this.lookupItems,
            stateHandler: this.handleLookupItemsToggle.bind(this)
        },
        "Better Rock Names": {
            type: 'checkbox',
            value: this.betterRockNames,
            stateHandler: this.handleBetterRockNamesToggle.bind(this)
        }
    }

    async init() {
        this.originalNPCIntersects = document.game.NPC.prototype.intersects;
        this.originalSceneIntersects = document.game.OptimizedScene.prototype.intersects;
        this.originalInventoryContextOptions = document.game.Inventory.prototype._getAllContextOptions;
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Enhanced Context Menu", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        this.isEnabled = state;
        this.updateState();
    }

    handleHideStairsToggle(state: boolean): void {
        this.hideStairs = state;
        this.updateState();
    }

    handleLookupNPCsToggle(state: boolean): void {
        this.lookupNPCs = state;
        this.updateState();
    }

    handleLookupObjectsToggle(state: boolean): void {
        this.lookupObjects = state;
        this.updateState();
    }

    handleLookupItemsToggle(state: boolean): void {
        this.lookupItems = state;
        this.updateState();
    }

    handleBetterRockNamesToggle(state: boolean): void {
        this.betterRockNames = state;
        this.updateState();
    }

    updateState() {
        if (this.isEnabled) {
            let plugin = this;
            if (this.lookupNPCs) {
                document.game.NPC.prototype.intersects = document.game.NPC.prototype.intersects = function (ray, list) {
                    const self = (this as any);
                    let i = self.object.intersect(ray);
    
                    if (!i) {
                        return;
                    }
    
                    if (self.info.attackable)
                        list.push({
                            color: 'red',
                            distance: i.distance,
                            priority: (self.levelDifference <= 10 && !document.game.PLAYER.character.combat) ? 2 : -2,
                            object: this,
                            text: "Attack",
                            action: () => self.attack()
                        });
                    if (self.info.talkable)
                        list.push({
                            color: 'red',
                            distance: i.distance,
                            priority: 1,
                            object: this,
                            text: "Talk to",
                            action: () => self.talk()
                        });
                    if (self.info.tradeable)
                        list.push({
                            color: 'red',
                            distance: i.distance,
                            priority: 2,
                            object: this,
                            text: "Trade with",
                            action: () => self.trade()
                        });
                    if (self.info.banker)
                        list.push({
                            color: 'red',
                            distance: i.distance,
                            priority: 3,
                            object: this,
                            text: "Bank with",
                            action: () => self.bank()
                        });
                    list.push({
                        object: this,
                        distance: i.distance,
                        priority: 0,
                        text: "Lookup",
                        action: () => {
                            // Take the name of the NPC remove any spaces 
                            const cleanName = self.info.name.replace(' ', '_');
                            console.log(cleanName);
                            window.open(plugin.wikiBaseURL + cleanName, '_blank');
                        }
                    })
                }
            } else {
                document.game.NPC.prototype.intersects = this.originalNPCIntersects;
            }

            if (this.lookupObjects || this.hideStairs || this.betterRockNames) {
                document.game.OptimizedScene.prototype.intersects = function (ray, list) {
                    const self = (this as any);
                    let seen = new Set();
                    for (let i in self.objectStatus) {
                        let o = self.allObjects[i];
                        if (!self.checkInteract(o)) continue;
                        if (o.ignore_intersections) continue;
    
                        let oi;
                        if (o.bounding_box) {
                            let point = ray.ray.intersectBox(o.bounding_box, plugin.intersect_vector);
                            oi = point ? [point] : [];
                        } else {
                            oi = ray.intersectObject(o.mesh, true);
                        }
                        if (oi.length > 0) {
                            let thing = o.source;
                            let actions = thing.actions();
                            for (let i in actions) {
                                /* if stairs or ladder depo if setting checked */
                                if (plugin.hideStairs && !document.game.KEYBOARD['16']) { //its conveint genfanad keeps track of all keyboard keys
                                    switch (actions[i].text) {
                                        case "Climb up":
                                        case "Climb down":
                                            actions[i].priority = -10;
                                    }
                                } else {
                                    switch (actions[i].text) {
                                        case "Climb up":
                                        case "Climb down":
                                            actions[i].priority = 1;
                                    }
                                }
                                list.push(Object.assign({}, actions[i], {
                                    distance: oi[0].distance
                                }));
                            }

                            if (plugin.betterRockNames && o.modelInfo.impl && o.modelInfo.impl.params && o.modelInfo.impl.class === "rock" && o.modelInfo.name === "Rock") {
                                let rockName = o.modelInfo.impl.params;
                                // Capitalize the first letter of the rock name
                                rockName = rockName.charAt(0).toUpperCase() + rockName.slice(1);

                                o.modelInfo.name = rockName + " Rock";
                            } else if (!plugin.betterRockNames && o.modelInfo.impl && o.modelInfo.impl.params && o.modelInfo.impl.class === "rock" && o.modelInfo.name.includes("Rock")) {
                                o.modelInfo.name = "Rock";
                            }

                            // If it has more than just an examine action, add a lookup action (it likely has a wiki page)
                            // and we are looking up objects
                            if (actions.length !== 1 && plugin.lookupObjects) {
                                list.push({
                                    object: thing,
                                    distance: oi[0].distance,
                                    priority: -2,
                                    text: "Lookup",
                                    action: () => {
                                        if (plugin.betterRockNames && o.modelInfo.impl && o.modelInfo.impl.params && o.modelInfo.impl.class === "rock" && o.modelInfo.name.includes("Rock")) {
                                            let cleanName = thing.text();
                                            cleanName = thing.text().replace(/(<([^>]+)>)/gi, "");
                                            cleanName = cleanName.replace(' ', '_'); // Normal Space Replacement
                                            cleanName = cleanName.replace('%20', '_'); // HTML Special Character Space Replacement

                                            window.open(plugin.wikiBaseURL + cleanName, '_blank');
                                        } else {
                                            // Remove the HTML tags from the text
                                            let cleanName = thing.text().replace(/(<([^>]+)>)/gi, "");

                                            // Okay so this is a bit of a hack, but it works
                                            // This fixes the issue where when you disable the better rock names option
                                            // the rocks still have the type ("Iron", "Coal", etc.) in the name
                                            if (o.modelInfo.impl && o.modelInfo.impl.params && o.modelInfo.impl.class === "rock" && o.modelInfo.name.includes("Rock")) {
                                                let rockType = o.modelInfo.impl.params;

                                                // Capitalize the first letter of the rock type
                                                rockType = rockType.charAt(0).toUpperCase() + rockType.slice(1);

                                                cleanName = rockType + " Rock";
                                            }
        
                                            // Replace any spaces with underscores
                                            cleanName = cleanName.replace(' ', '_');

                                            // Open the wiki page in a new tab
                                            window.open(plugin.wikiBaseURL + cleanName, '_blank');
                                        }
                                    }
                                })
                            }
                        }
                    }
                }
            } else {
                document.game.OptimizedScene.prototype.intersects = this.originalSceneIntersects;
            }

            if (this.lookupItems) {
                document.game.Inventory.prototype._getAllContextOptions = function(e, t) {
                    plugin.originalInventoryContextOptions.call(this, e, t);

                    let r = {
                        type: "item",
                        id: e,
                        text: () => "<span class='item'>" + document.game.DATA.items[this.items[e].item].name + "</span>"
                    }

                    let cleanName = document.game.DATA.items[this.items[e].item].name.replace(' ', '_');

                    // Remove H.Q. / L.Q. from the name of the item
                    cleanName = cleanName.replace('H.Q.', '');
                    cleanName = cleanName.replace('L.Q.', '');

                    // Remove " +1" and " +2" from the name of the item
                    cleanName = cleanName.replace(' +1', '');
                    cleanName = cleanName.replace(' +2', '');

                    t.push({
                        text: "Lookup",
                        priority: -2,
                        object: r,
                        action: () => {
                            window.open(plugin.wikiBaseURL + cleanName, '_blank');
                        }
                    })
                }   
            } else {
                document.game.Inventory.prototype._getAllContextOptions = this.originalInventoryContextOptions;
            }
        } else {
            document.game.NPC.prototype.intersects = this.originalNPCIntersects;
            document.game.OptimizedScene.prototype.intersects = this.originalSceneIntersects;
            document.game.Inventory.prototype._getAllContextOptions = this.originalInventoryContextOptions;
        }
    }
}

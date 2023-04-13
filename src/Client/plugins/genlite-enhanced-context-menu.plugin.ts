/*
    Copyright (C) 2022-2023 KKonaOG
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/


import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteEnhancedContextMenu extends GenLitePlugin {
    static pluginName = 'GenLiteEnhancedContextMenu';

    wikiBaseURL: string = "https://genfanad.fandom.com/wiki/";
    isEnabled: boolean = false;

    hideStairs: boolean = false;
    lookupNPCs: boolean = false;
    lookupObjects: boolean = false;
    lookupItems: boolean = false;
    photosEnabled: boolean = true;
    betterRockNames: boolean = false;
    rightClickAttack: boolean = false;

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
        },
        "Right Click Attack": {
            type: 'checkbox',
            oldKey: 'NPCMenuSwapper.rightClickAttack',
            value: this.rightClickAttack,
            stateHandler: this.handleRightClickAttackToggle.bind(this)
        },
        "Right Click Photo": {
            type: 'checkbox',
            value: this.photosEnabled,
            stateHandler: this.handlePhotosEnabledToggle.bind(this)
        },
    }

    async init() {
        document.genlite.registerPlugin(this);
        this.originalNPCIntersects = document.game.NPC.prototype.intersects;
        this.originalSceneIntersects = document.game.OptimizedScene.prototype.intersects;
        this.originalInventoryContextOptions = document.game.Inventory.prototype._getAllContextOptions;
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Enhanced Context Menu", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        this.isEnabled = state;
    }

    handleHideStairsToggle(state: boolean): void {
        this.hideStairs = state;
    }

    handleLookupNPCsToggle(state: boolean): void {
        this.lookupNPCs = state;
    }

    handleLookupObjectsToggle(state: boolean): void {
        this.lookupObjects = state;
    }

    handleLookupItemsToggle(state: boolean): void {
        this.lookupItems = state;
    }

    handlePhotosEnabledToggle(state: boolean): void {
        this.photosEnabled = state;
    }

    handleBetterRockNamesToggle(state: boolean): void {
        this.betterRockNames = state;
    }

    handleRightClickAttackToggle(state: boolean): void {
        this.rightClickAttack = state;
    }

    NPC_intersects(ray, list) {
        // If the plugin is disabled or list is empty, return
        if (!this.isEnabled || list.length === 0) return;

        // Create a Map to store the actions
        let NPCs = new Map();
        let Players = new Map();

        let iii = 0;
        for (let i = 0; i < list.length; i++) {
            // Get the action object
            let actionObject = list[i].object;

            if (actionObject.type === "player") {
                if (Players.has(actionObject)) {
                    // Push the action to the existing array
                    Players.get(actionObject).push(list[i]);
                } else {
                    // Create a new array and push the action
                    Players.set(actionObject, [list[i]]);
                }
                continue;
            }

            // See if the object is already in the set
            if (NPCs.has(actionObject)) {
                // Push the action to the existing array
                NPCs.get(actionObject).push(list[i]);
            }
            else {
                // Create a new array and push the action
                NPCs.set(actionObject, [list[i]]);
            }
        }

        NPCs.forEach((value, key) => {
            if (this.lookupNPCs && (!value.find((action) => action.text === "Lookup"))) {
                // Create Lookup Action
                list.push({
                    object: key,
                    distance: value[0].distance,
                    priority: -3,
                    text: "Lookup",
                    action: () => {
                        const cleanName = key.info.name.replace(' ', '_');
                        // Take the name of the NPC remove any spaces
                        window.open(this.wikiBaseURL + cleanName, '_blank');
                    }
                });
            }

            if (key.info.attackable) {
                // Find the list element with the attack action attached to key
                let attackAction = list.find((action) => action.text === "Attack" && action.object === key);
                attackAction.priority = (!this.rightClickAttack && key.levelDifference <= 10 && !document.game.PLAYER.character.combat) ? 2 : -2;
            }
        });

        Players.forEach((value, key) => {
            if (this.photosEnabled && (!value.find((action) => action.text === "Take Photo of"))) {
                list.push({
                    object: key,
                    distance: value[0].distance,
                    priority: -4,
                    text: "Take Photo of",
                    action: () => {
                        let chatplugin = document['GenLiteChatPlugin'];
                        if (chatplugin) {
                            chatplugin.uiFetchNewProfilePic(key.nickname, null);
                        }
                    }
                });
            }
        });
    }

    OptimizedScene_intersects(ray, list) {
        if (!this.isEnabled || list.length === 0) return;

        let sceneObjects = new Map();

        for (let i = 0; i < list.length; i++) {
            let sceneObject = list[i].object;

            if (sceneObject.type === "player") continue;

            // See if the object is already in the set
            if (sceneObjects.has(sceneObject)) {
                // Push the action to the existing array
                sceneObjects.get(sceneObject).push(list[i]);
            } else {
                // Create a new array and push the action
                sceneObjects.set(sceneObject, [list[i]]);
            }
        }

        // Find all actions in the list that are "Climb up" or "Climb down"
        let climbActions = list.filter((action) => action.text === "Climb up" || action.text === "Climb down");

        if (this.hideStairs && !document.game.KEYBOARD['16']) {
            // Set the priority of all climb actions to -10
            climbActions.forEach((action) => action.priority = -10);
        } else {
            // Set the priority of all climb actions to 1
            climbActions.forEach((action) => action.priority = 1);
        }

        // 
        sceneObjects.forEach((value, key) => {
            // Get the detailed object information

            // If the object has more than one action, it is an object worth looking up
            // This filters out things like the world object (it contains walk here action)
            // As well as filters out things with just an examine action

            // Get the detailed object information from document.game.GRAPHICS.scene.allObjects which is an object containing objects stored by their id
            let detailedObject = document.game.GRAPHICS.scene.allObjects[key.id];

            // If the object is not in the allObjects object, we can't do anything with it
            if (!detailedObject) {
                return;
            }

            if (value.length <= 1 && !(detailedObject.modelInfo && detailedObject.modelInfo.impl && detailedObject.modelInfo.impl.class === "rock")) {
                return;
            }

            // Hardcoded things to ignore such as Doors, etc.
            const nickIgnoreList = ["Door"]

            if (nickIgnoreList.includes(detailedObject.nick)) {
                return;
            }

            if (this.lookupObjects && (!value.find((action) => action.text === "Lookup"))) {
                // Create Lookup Action
                list.push({
                    object: key,
                    distance: value[0].distance,
                    priority: -3,
                    text: "Lookup",
                    action: () => {
                        // Take the name of the NPC remove any spaces
                        if (detailedObject.modelInfo.name === "Rock") {
                            // Get the params from the rock, this is the rock type
                            let rockType = detailedObject.modelInfo.impl.params;

                            // Capitalize the first letter of the rock type
                            rockType = rockType.charAt(0).toUpperCase() + rockType.slice(1);

                            const cleanName = rockType + "_Rock";
                            window.open(this.wikiBaseURL + cleanName, '_blank');
                        } else {
                            const cleanName = detailedObject.modelInfo.name.replace(' ', '_');
                            window.open(this.wikiBaseURL + cleanName, '_blank');
                        }
                    }
                })
            }

            if (this.betterRockNames && detailedObject.modelInfo.impl.class === "rock") {
                // Get the params from the rock, this is the rock type
                let rockType = detailedObject.modelInfo.impl.params;

                // Capitalize the first letter of the rock type
                rockType = rockType.charAt(0).toUpperCase() + rockType.slice(1);

                // Save the old rock name as a property
                if (!detailedObject.modelInfo.originalName) {
                    detailedObject.modelInfo.originalName = detailedObject.modelInfo.name;
                }

                // Set the new rock name
                detailedObject.modelInfo.name = rockType + " Rock";
            } else if (!this.betterRockNames && detailedObject.modelInfo.impl.class === "rock" && detailedObject.modelInfo.originalName) {
                // Set Model Name back to original name
                detailedObject.modelInfo.name = detailedObject.modelInfo.originalName;
                detailedObject.modelInfo.originalName = null; // Remove the original name property, this allows this to only run once
            }
        });
    }

    Inventory__getAllContextOptions(slotID, itemActions) {
        if (!this.isEnabled || !this.lookupItems) {
            return;
        }

        if (!document.game.INVENTORY.items[slotID])
            return;

        const objectName = itemActions[0].object.text();

        let cleanName = objectName.replace(/(<([^>]+)>)/gi, ""); // Remove the HTML tags from the name
        cleanName = cleanName.replace('Scrip - ', ''); // Remove Scrip - from the name of the item
        cleanName = cleanName.replace(' ', '_'); // Replace spaces with underscores

        // Remove H.Q. / L.Q. from the name of the item
        cleanName = cleanName.replace('H.Q.', '');
        cleanName = cleanName.replace('L.Q.', '');

        // Remove " +1" and " +2" from the name of the item
        cleanName = cleanName.replace(' +1', '');
        cleanName = cleanName.replace(' +2', '');

        itemActions.push({
            text: "Lookup",
            priority: -2,
            object: itemActions[0].object,
            action: () => {
                window.open(this.wikiBaseURL + cleanName, '_blank');
            }
        })
    }
}

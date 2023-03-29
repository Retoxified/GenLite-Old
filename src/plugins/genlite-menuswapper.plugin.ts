/*
    Copyright (C) 2022-2023 Retoxified, dpeGit, snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import {GenLitePlugin} from '../core/interfaces/plugin.interface';

export class GenLiteMenuSwapperPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteMenuSwapperPlugin';

    useOneClickBank: boolean = false;
    useOneClickTrade: boolean = false;
    hideStairs: boolean = false;

    originalSceneIntersects: Function;
    originalNPCIntersects: Function;

    intersect_vector = new document.game.THREE.Vector3();
    async init() {
        document.genlite.registerPlugin(this);
        
        this.hideStairs = document.genlite.settings.add("NPCMenuSwapper.hideStairs", false, "Hide Stairs", "checkbox", this.handleHideStairsToggle, this);

        this.originalSceneIntersects = document.game.OptimizedScene.prototype.intersects;
        this.originalNPCIntersects = document.game.NPC.prototype.intersects;
        this.updateState();
    }

    updateState() {
        if (this.hideStairs) {
            document.game.OptimizedScene.prototype.intersects = this.sceneryIntersects;
        } else {
            document.game.OptimizedScene.prototype.intersects = this.originalSceneIntersects;
        }
    }

    handleHideStairsToggle(state: boolean) {
        this.hideStairs = state;
        this.updateState();
    }
/* leaviing this in as example code but its not needed any more 

    leftClickBankIntersects(ray, list) {
        const self = (this as any);

        let i = self.object.intersect(ray);
        if (!i)
            return;
        list.push({
            color: 'green',
            distance: i.distance,
            priority: -1,
            object: this,
            text: "Examine",
            action: () => self.examine()
        });
        let priority = (self.levelDifference <= 10 && !document.game.PLAYER.character.combat) ? 2 : -2;
        if (self.info.attackable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: priority,
                object: this,
                text: "Attack",
                action: () => self.attack()
            });
        if (self.info.talkable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: 2,
                object: this,
                text: "Talk to",
                action: () => self.talk()
            });
        if (self.info.tradeable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: document[GenLiteMenuSwapperPlugin.pluginName].useOneClickTrade ? 15 : 1,
                object: this,
                text: "Trade with",
                action: () => self.trade()
            });
        if (self.info.banker)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: document[GenLiteMenuSwapperPlugin.pluginName].useOneClickBank ? 15 : 1,
                object: this,
                text: "Bank with",
                action: () => self.bank()
            });
    }

    */

    /* clone of the original function with toggle for stairs */
    sceneryIntersects(ray, list) {
        const self = (this as any);
        let seen = new Set();
        for (let i in self.objectStatus) {
            let o = self.allObjects[i];
            if (!self.checkInteract(o)) continue;
            if (o.ignore_intersections) continue;

            let oi;
            if (o.bounding_box) {
                let point = ray.ray.intersectBox(o.bounding_box, document[GenLiteMenuSwapperPlugin.pluginName].intersect_vector);
                oi = point ? [point] : [];
            } else {
                oi = ray.intersectObject(o.mesh, true);
            }
            if (oi.length > 0) {
                let thing = o.source;
                let actions = thing.actions();
                for (let i in actions) {
                    /* if stairs or ladder depo if setting checked */
                    if (document[GenLiteMenuSwapperPlugin.pluginName].hideStairs && !document.game.KEYBOARD['16']) { //its conveint genfanad keeps track of all keyboard keys
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
            }
        }
    }
}

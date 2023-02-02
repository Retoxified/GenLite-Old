export class GenLiteMenuSwapperPlugin {
    static pluginName = 'GenLiteMenuSwapperPlugin';

    useOneClickBank: boolean = false;
    useOneClickTrade: boolean = false;
    hideStairs: boolean = false;

    intersect_vector = new THREE.Vector3();
    async init() {
        window.genlite.registerModule(this);

        this.useOneClickBank = window.genlite.settings.add("NPCMenuSwapper.LeftClickBank", true, "Left Click Bank", "checkbox", this.handleLeftClickBankToggle, this);
        this.useOneClickTrade = window.genlite.settings.add("NPCMenuSwapper.LeftClickTrade", true, "Left Click Trade", "checkbox", this.handleLeftClickTradeToggle, this);
        this.hideStairs = window.genlite.settings.add("NPCMenuSwapper.hideStairs", true, "Hide Stairs", "checkbox", this.handleHideStairsToggle, this);

        NPC.prototype.intersects = this.leftClickBankIntersects;
        OptimizedScene.prototype.intersects = this.sceneryIntersects;
        
    }


    handleLeftClickBankToggle(state: boolean) {
        this.useOneClickBank = state;
    }

    handleLeftClickTradeToggle(state: boolean) {
        this.useOneClickTrade = state;
    }

    handleHideStairsToggle(state: boolean) {
        this.hideStairs = state;
    }

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
        let priority = (self.levelDifference <= 10 && !PLAYER.character.combat) ? 2 : -2;
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
                priority: window[GenLiteMenuSwapperPlugin.pluginName].useOneClickTrade ? 15 : 1,
                object: this,
                text: "Trade with",
                action: () => self.trade()
            });
        if (self.info.banker)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: window[GenLiteMenuSwapperPlugin.pluginName].useOneClickBank ? 15 : 1,
                object: this,
                text: "Bank with",
                action: () => self.bank()
            });
    }

    sceneryIntersects(ray, list) {
        const self = (this as any);
        let seen = new Set();
        for (let i in self.objectStatus) {
            let o = self.allObjects[i];
            if (!self.checkInteract(o))
                continue;
            let oi;
            if (o.bounding_box) {
                let point = ray.ray.intersectBox(o.bounding_box, window[GenLiteMenuSwapperPlugin.pluginName].intersect_vector);
                oi = point ? [point] : [];
            } else {
                oi = ray.intersectObject(o.mesh, true);
            }
            if (oi.length > 0) {
                let thing = o.source;
                let actions = thing.actions();
                for (let i in actions) {
                    if (window[GenLiteMenuSwapperPlugin.pluginName].hideStairs && !KEYBOARD['16']) {
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

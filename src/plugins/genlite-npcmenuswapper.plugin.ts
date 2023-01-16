export class GenLiteNPCMenuSwapperPlugin {
    static pluginName = 'GenLiteNPCMenuSwapperPlugin';

    useOneClickBank: boolean = false;
    useOneClickTrade: boolean = false;
    async init() {
        window.genlite.registerModule(this);

        this.useOneClickBank = window.genlite.settings.add("NPCMenuSwapper.LeftClickBank", true, "Left Click Bank", "checkbox", this.handleLeftClickBankToggle, this);
        this.useOneClickTrade = window.genlite.settings.add("NPCMenuSwapper.LeftClickTrade", true, "Left Click Trade", "checkbox", this.handleLeftClickTradeToggle, this);

        NPC.prototype.intersects = this.leftClickBankIntersects;
    }


    handleLeftClickBankToggle(state: boolean) {
        this.useOneClickBank = state;
    }

    handleLeftClickTradeToggle(state: boolean) {
        this.useOneClickTrade = state;
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
            action: ()=>self.examine()
        });
        let priority = (self.levelDifference <= 10 && !PLAYER.character.combat) ? 2 : -2;
        if (self.info.attackable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: priority,
                object: this,
                text: "Attack",
                action: ()=>self.attack()
            });
        if (self.info.talkable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: 2,
                object: this,
                text: "Talk to",
                action: ()=>self.talk()
            });
        if (self.info.tradeable)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: window[GenLiteNPCMenuSwapperPlugin.pluginName].useOneClickTrade ? 15 : 1,
                object: this,
                text: "Trade with",
                action: ()=>self.trade()
            });
        if (self.info.banker)
            list.push({
                color: 'red',
                distance: i.distance,
                priority: window[GenLiteNPCMenuSwapperPlugin.pluginName].useOneClickBank ? 15 : 1,
                object: this,
                text: "Bank with",
                action: ()=>self.bank()
            });
    }
}

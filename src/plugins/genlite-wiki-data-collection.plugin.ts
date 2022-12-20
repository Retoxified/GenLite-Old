export class GenLiteWikiDataCollectionPlugin {
    static pluginName = 'GenLiteWikiDataCollectionPlugin';

    previously_seen = [];

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.isPluginEnabled = window.genlite.settings.add(
            "WikiDataColl.Enable",
            false,
            "Wiki Data collection(REMOTE SERVER)",
            "checkbox",
            this.handlePluginEnableDisable,
            this,
            "Warning!\n"+ // Warning
            "Turning this setting on will send various pieces of data that benefit the wiki along with your IP\u00A0address to an external server.\n\n" +
            "Are you sure you want to enable this setting?"
        );
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
    }

    combatUpdate(update) {
        if(!this.isPluginEnabled){
            return;
        }
        let object = GAME.objectById(update.id);

        if (!object || !object.object || object.object.constructor.name !== "MonsterCharacter")
            return;

        if(this.previously_seen.find(x => x.Name === object.info.name && x.Level === object.info.level && x.MaxHP === update.maxhp ) === undefined)
        {
            let monsterdata = {
                "Monster_Name": object.info.name,
                "Monster_Level": object.info.level,
                "Monster_HP": update.maxhp
            };

            this.previously_seen.push(monsterdata);

            window.genlite.sendDataToServer("monsterdata", monsterdata);
        }
    }
}

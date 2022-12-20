export class GenLiteWikiDataCollectionPlugin {
    static pluginName = 'GenLiteWikiDataCollectionPlugin';

    previously_seen = [];

    async init() {
        window.genlite.registerModule(this);
        window.genlite.installHook(Game.prototype, 'combatUpdate',  this.hook_Game_combatUpdate,  this);
    }

    hook_Game_combatUpdate(update) {
        let object = GAME.objectById(update.id);

        if (!object || !object.object || object.object.constructor.name !== "MonsterCharacter")
            return;

        if(this.previously_seen.find(x => x.Name === object.info.name && x.Level === object.info.level && x.MaxHP === object.object.maxhp ) === undefined)
        {
            let monsterdata = {
                "Monster_Name": object.info.name,
                "Monster_Level": object.info.level,
                "Monster_HP": update.maxhp
            };

            this.previously_seen.push(monsterdata);

            this.sendDataToServer("monsterdata", monsterdata);
        }
    }

    sendDataToServer(url, data) {
        var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", `https://nextgensoftware.nl/${url}.php`);
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(data));
    }
}

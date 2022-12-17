// ==UserScript==
// @name         GenLite Wiki Datacollection
// @namespace    GenLite
// @version      0.1.2
// @description  try to take over the world!
// @author       TwistedFate#4053
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==

(function() {
    class GenLiteWikiDataCollection {

        previously_seen = [];

        init() {
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

    window.genliteWikiDataCollection = new GenLiteWikiDataCollection();

    let gameLoadTimer = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteWikiDataCollection.init();
                clearInterval(gameLoadTimer);
            }
        } catch (e) {
        }
    }, 1000);
})();
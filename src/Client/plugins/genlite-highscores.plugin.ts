/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

class Highscore {
    Player: string;
    Stats: [
        {
            Stat: string,
            Data1: number,
            Data2?: number,
            Data3?: number,
            Data4?: number,
            Data5?: number,
        }?
    ] = [];
}

export class GenLiteHighscores extends GenLitePlugin {
    static pluginName = 'GenLiteHighscores';

    highscores: Highscore;

    walkStats = {
        n: 0,
        e: 0,
        s: 0,
        w: 0,
        total: 0
    }

    sendInterval: NodeJS.Timer = null;

    submitItemsToServer: boolean;
    /* a list of all stats we are collecting */
    statsToSend: {
        [stat: string]: boolean
    } = {
            "Skills": false,
            "Played": false,
            "Walking": false
        };
    sendAll: boolean;
    updatedSkills: { [skill: string]: boolean } = {
        vitality: true,
        attack: true,
        strength: true,
        defense: true,
        ranged: true,
        sorcery: true,
        evocation: true,
        survival: true,
        piety: true,
        logging: true,
        mining: true,
        botany: true,
        butchery: true,
        cooking: true,
        forging: true,
        artistry: true,
        tailoring: true,
        whittling: true,
        total: true,
        combatLevel: true
    }

    pluginSettings: Settings = {}

    curCombatLevel: number = 0;
    async init() {
        document.genlite.registerPlugin(this);
        console.log(`%c[GenLite] TODO: %c${this.constructor.name} %c need an implementation for Toggle All`, "color: #ff0", "color: #fff", "color: #f00");
        // this.sendAll = document.genlite.settings.add(`Highscore.ToggleButton`, false, `Toggle All Settings`, "checkbox", this.toggleAll, this, undefined, undefined, "Highscores.SubmitToServer");
        
        for (let key in this.statsToSend) {
            this.pluginSettings[key] = {
                type: "checkbox",
                oldKey: `GenLite.Highscores.${key}.Enable`,
                value: false,
                stateHandler: (state) => { this.statsToSend[key] = state },
            }
        }
        
        // this.statsToSend[key] = document.genlite.settings.add(`Highscore.${key}.Enable`, false, `Highscore: ${key}`, "checkbox", (state) => { this.statsToSend[key] = state }, this, undefined, undefined, "Highscores.SubmitToServer");

        let walkStr = localStorage.getItem("Highscores.walkData")
        if (walkStr != null)
            this.walkStats = JSON.parse(walkStr)
    }

    handlePluginState(state: boolean): void {
        this.handleSubmitToServer(state);
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Highscores", "GenLite.Highscores.SubmitToServer", this.handlePluginState.bind(this), this.pluginSettings, true, "Warning! Turning this setting on will send highscore data along with your IP address to an external server. Are you sure you want to enable this setting?")
    }

    handleSubmitToServer(state) {
        this.submitItemsToServer = state;
        if (state) {
            this.loginOK();
        } else {
            this.Network_logoutOK();
        }
    }

    /* this will set all the settings to whatever the current stat of toggle all is
    bit clunky but better than nothing 
    */
    toggleAll(state) {
        this.sendAll = state;
        for (let key in this.statsToSend)
            document.genlite.settings.toggle(`Highscore.${key}.Enable`, state);
    }

    /* interval setup */
    loginOK() {
        if (!this.submitItemsToServer)
            return;
        this.sendToServer();
        if (this.sendInterval == null)
            this.sendInterval = setInterval(() => { this.sendToServer.apply(this) }, 5 * 60 * 1000)
    }

    /* stop intercals */
    Network_logoutOK() {
        clearInterval(this.sendInterval);
        this.sendInterval = null;
    }

    initializeUI () {
        this.curCombatLevel = document.game.PLAYER_INFO.combat_level;
    }

    Network_handle(verb, payload) {
        /* count steps */
        if (verb == "move" && document.game.PLAYER && payload.id == document.game.PLAYER.id) {
            switch (payload.direction) {
                case 0:
                    this.walkStats.e++;
                    break;
                case 45:
                    this.walkStats.e += 0.5;
                    this.walkStats.s += 0.5;
                    break;
                case 90:
                    this.walkStats.s++;
                    break;
                case 135:
                    this.walkStats.s += 0.5;
                    this.walkStats.w += 0.5;
                    break;
                case 180:
                    this.walkStats.w++;
                    break;
                case -45:
                    this.walkStats.n += 0.5;
                    this.walkStats.e += 0.5;
                    break;
                case -90:
                    this.walkStats.n++;
                    break;
                case -135:
                    this.walkStats.n += 0.5;
                    this.walkStats.w += 0.5;
                    break;
                default:
                    break;
            }
            this.walkStats.total++;
            localStorage.setItem("Highscores.walkData", JSON.stringify(this.walkStats))
            return;
        }

        if (verb == 'xp') {
            this.updatedSkills[payload.skill] = true;
            this.updatedSkills["total"] = true;
            if(this.curCombatLevel != document.game.PLAYER_INFO.combat_level){
                this.updatedSkills['combatLevel'] = true;
                this.curCombatLevel = document.game.PLAYER_INFO.combat_level;
            }
        }
    }

    /* update the high scores object */
    updateScores() {
        this.highscores = new Highscore();
        this.highscores.Player = document.game.PLAYER.character.name()

        if (this.statsToSend.Skills) {
            let totalLevel = 0, totalXp = 0;
            for (let key in document.game.PLAYER_INFO.skills) {
                let skill = document.game.PLAYER_INFO.skills[key];
                totalLevel += skill.level;
                totalXp += skill.xp;

                if (!this.updatedSkills[key])
                    continue;

                this.highscores.Stats.push({
                    Stat: skill.name,
                    Data1: skill.level,
                    Data2: skill.xp
                });

            }
            if (this.updatedSkills["total"]) {
                this.highscores.Stats.push({
                    Stat: "Total",
                    Data1: totalLevel,
                    Data2: totalXp
                });
            }

            if (this.updatedSkills["combatLevel"]){
                this.highscores.Stats.push({
                    Stat: "Combat Level",
                    Data1: this.curCombatLevel
                });
            }
            this.updatedSkills = {};
        }

        if (this.statsToSend.Played) {
            if (document['GenLiteGeneralChatCommands'].playedTime > 31556926000) {
                document['GenLiteGeneralChatCommands'].playedTime = 0;
            } else {
                this.highscores.Stats.push(
                    {
                        Stat: "Played Time",
                        Data1: document['GenLiteGeneralChatCommands'].playedTime
                    });
            }
        }

        if (this.statsToSend.Walking) {
            this.highscores.Stats.push(
                {
                    Stat: "Tiles Walked",
                    Data1: this.walkStats.total,
                    Data2: this.walkStats.n,
                    Data3: this.walkStats.s,
                    Data4: this.walkStats.w,
                    Data5: this.walkStats.e,
                });
        }
    }
    sendToServer() {
        this.updateScores();
        document.genlite.sendDataToServer("playerstats", this.highscores);
    }
}

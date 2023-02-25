import { GenLitePlugin } from '../core/interfaces/plugin.interface';

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

export class GenLiteHighscores implements GenLitePlugin {
    static pluginName = 'GenLiteHighscores';

    highscores: Highscore;

    walkStats = {
        n: 0,
        e: 0,
        s: 0,
        w: 0,
        total: 0
    }

    sendInterval: NodeJS.Timer;

    submitItemsToServer: boolean;
    statsToSend: {
        [stat: string]: boolean
    } = {
            "Skills": false,
            "Played": false,
            "Walking": false
        };
    sendAll: boolean;
    async init() {
        window.genlite.registerPlugin(this);
        this.submitItemsToServer = window.genlite.settings.add(
            "Highscores.SubmitToServer", // Key
            false,                         // Default
            "Send Highscores to Server(REMOTE SERVER)", // Name in UI
            "checkbox", // Type
            this.handleSubmitToServer, // handler function
            this,  // context for handler
            "Warning!\n" + // Warning
            "Turning this setting on will send highscore data along with your IP\u00A0address to an external server.\n\n" +
            "Are you sure you want to enable this setting?"
        );
        this.sendAll = window.genlite.settings.add(`Highscore.ToggleButton`, false, `Toggle All Settings`, "checkbox", this.toggleAll, this, undefined, undefined, "Highscores.SubmitToServer");
        for (let key in this.statsToSend)
            this.statsToSend[key] = window.genlite.settings.add(`Highscore.${key}.Enable`, false, `Highscore: ${key}`, "checkbox", (state) => { this.statsToSend[key] = state }, this, undefined, undefined, "Highscores.SubmitToServer");

        let walkStr = localStorage.getItem("Highscores.walkData")
        if (walkStr != null)
            this.walkStats = JSON.parse(walkStr)
    }

    handleSubmitToServer(state) {
        if (state) {
            this.loginOK();
        } else {
            this.logoutOK();
        }
    }

    toggleAll(state) {
        this.sendAll = state;
        for(let key in this.statsToSend)
            window.genlite.settings.toggle(`Highscore.${key}.Enable`, state); 
    }

    loginOK() {
        if (!this.submitItemsToServer)
            return;
        this.sendToServer();
        this.sendInterval = setInterval(() => { this.sendToServer.apply(this) }, 60 * 1000)
    }

    logoutOK() {
        clearInterval(this.sendInterval);
        this.sendInterval = null;
    }

    handle(verb, payload) {
        if (verb == "move" && PLAYER && payload.id == PLAYER.id) {
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
    }

    updateScores() {
        this.highscores = new Highscore();
        this.highscores.Player = PLAYER.character.name()

        if (this.statsToSend.Skills) {
            for (let key in PLAYER_INFO.skills) {
                let skill = PLAYER_INFO.skills[key];
                this.highscores.Stats.push({
                    Stat: skill.name,
                    Data1: skill.level,
                    Data2: skill.xp
                })
            }
        }

        if (this.statsToSend.Played) {
            if (window.GenLiteGeneralChatCommands.playedTime > 31556926000) {
                alert("Your //played is bugged.\
                If you never reset it before then reset it with `GenLiteGeneralChatCommands.playedTime = 0` in your browser console \
                If this is the second time you have seen this after reseting please @dpepls on discord with details");
            } else {
                this.highscores.Stats.push(
                    {
                        Stat: "Played Time",
                        Data1: window.GenLiteGeneralChatCommands.playedTime
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
        window.genlite.sendDataToServer("playerstats", this.highscores);
    }
}
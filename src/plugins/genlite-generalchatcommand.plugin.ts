import {GenLitePlugin} from '../core/interfaces/plugin.interface';

export class GenLiteGeneralChatCommands implements GenLitePlugin {
    static pluginName = 'GenLiteGeneralChatCommands';

    loginTime: number = 0;
    playedTime: number = 0; // this is a running counter not a date
    timeSinceLastSave: number = 0;

    playedSaveInverval: NodeJS.Timer;

    async init() {
        window.genlite.registerPlugin(this);

        let playedString = localStorage.getItem("genlitePlayed")
        if (playedString == null) {
            this.playedTime = 0;
        } else {
            this.playedTime = parseInt(playedString);
        }
        window.genlite.commands.register("played", () => { this.printPlayedTime.apply(this) }, "Prints time played.");
        window.genlite.commands.register("logged", () => { this.printLoggedTime.apply(this) }, "Prints time logged in.");
    }

    loginOK() {
        console.log("login");
        this.loginTime = Date.now();
        this.timeSinceLastSave = this.loginTime;
        this.playedSaveInverval = setInterval(() => this.savePlayed.apply(this), 1000); // set an interval to save the playedTime every second in case of ungraceful close
    }

    logoutOK() {
        console.log("logout");
        this.loginTime = 0;
        clearInterval(this.playedSaveInverval);
        this.playedSaveInverval = null;
        this.savePlayed();
    }

    /* genlite command callbacks */
    printLoggedTime() {
        window.genlite.commands.print(this.msToHumanTime(Date.now() - this.loginTime));
    }

    printPlayedTime() {
        window.genlite.commands.print(this.msToHumanTime(this.playedTime));
    }

    savePlayed() {
        let curTime = Date.now();
        if(this.timeSinceLastSave == 0) { //if for whatever reason this wasnt set (currently caused by a genfanad bug not genlite set it now and just ignore this update)
            this.timeSinceLastSave = Date.now();
            return;
        }
        this.playedTime += curTime - this.timeSinceLastSave;
        this.timeSinceLastSave = curTime;
        localStorage.setItem("genlitePlayed", this.playedTime.toString());
    }

    msToHumanTime(ms) {
        let h = Math.floor(ms / 3600000);
        let m = Math.floor(ms / 60000) % 60;
        let s = Math.floor(ms / 1000) % 60;

        let hS = h.toString();
        let mS = m < 10 ? "0" + m.toString() : m.toString();
        let sS = s < 10 ? "0" + s.toString() : s.toString();


        return `${hS}:${mS}:${sS}`
    }
}

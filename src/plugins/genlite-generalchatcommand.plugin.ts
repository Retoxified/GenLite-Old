export class GenLiteGeneralChatCommands {
    static pluginName = 'GenLiteGeneralChatCommands';

    loginTime: number = 0;
    playedTime: number = 0;
    timeSinceLastSave: number = 0;

    playedSaveInverval: NodeJS.Timer;;

    async init() {
        window.genlite.registerModule(this);

        let playedString = localStorage.getItem("genlitePlayed")
        if (playedString == null) {
            this.playedTime = 0;
        } else {
            this.playedTime = parseInt(playedString);
        }
        window.genlite.commands.register("played", () => {this.printPlayedTime.apply(this)} , "Prints time played.");
        window.genlite.commands.register("logged", () => {this.printLoggedTime.apply(this)} , "Prints time logged in.");
    }

    loginOK(){
        this.loginTime = Date.now();
        this.timeSinceLastSave = this.loginTime;
        this.playedSaveInverval = setInterval(() => this.savePlayed.apply(this), 1000);
    }

    logoutOK(){
        this.loginTime = 0;
        clearInterval(this.playedSaveInverval);
        this.savePlayed();
    }

    printLoggedTime(){
        window.genlite.commands.print(this.msToHumanTime(Date.now() - this.loginTime));
    }

    printPlayedTime(){
        window.genlite.commands.print(this.msToHumanTime(this.playedTime));
    }

    savePlayed(){
        let curTime = Date.now();
        this.playedTime += curTime - this.timeSinceLastSave;
        this.timeSinceLastSave = curTime;
        localStorage.setItem("genlitePlayed", this.playedTime.toString())
    }

    msToHumanTime(ms){
        let h = Math.floor(ms / 3600000);
        let m = Math.floor(ms / 60000) % 60;
        let s = Math.floor(ms / 1000) % 60;

        let hS = h.toString();
        let mS = m < 10 ? "0" + m.toString() : m.toString();
        let sS = s < 10 ? "0" + s.toString() : s.toString();


        return `${hS}:${mS}:${sS}`
    }
}

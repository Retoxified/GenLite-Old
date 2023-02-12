export class GenLiteMusicPlugin {
    static pluginName = 'GenLiteMusicPlugin';

    isPluginEnabled: boolean = false;
    originalSetTrack: Function;

    selectionMenu: HTMLElement;
    displayed = false;

    selectionOptions: {[key: string]: HTMLElement} = {};
    currentSelection: HTMLElement = null;

    // plugin modes
    //   passthrough - default genfanad music
    //   manual      - manual select and repeat song
    //   shuffle     - change song every 3 min
    musicMode: "passthrough" | "manual" | "shuffle" = "passthrough";

    // save state when enabling shuffle
    previousMode: "passthrough" | "manual" = "passthrough";
    shuffleTimeout = 0;

    currentTrack = "";

    async init() {
        window.genlite.registerModule(this);
        this.originalSetTrack = MUSIC_PLAYER.setNextTrack;

        this.isPluginEnabled = window.genlite.settings.add(
            "MusicPlugin.Enable",
            false,
            "Music Selection",
            "checkbox",
            this.handlePluginEnableDisable,
            this
        );

        this.selectionMenu = <HTMLElement>document.createElement("div");
        this.selectionMenu.style.position = "fixed";
        this.selectionMenu.style.border = "2px solid black";
        this.selectionMenu.style.right = "20px";
        this.selectionMenu.style.top = "20px";
        this.selectionMenu.style.height = "20em";
        this.selectionMenu.style.display = "flex";
        this.selectionMenu.style.flexDirection = "column";
        this.selectionMenu.style.fontFamily = "iacme,times new roman,Times,serif";

        let header = <HTMLElement>document.createElement("div");
        header.innerText = "Music Selection";
        header.style.backgroundColor = "darkgray";
        header.style.padding = "4px";
        header.style.textAlign = "center";
        this.selectionMenu.appendChild(header);

        let container = <HTMLElement>document.createElement("div");
        container.style.overflow = "scroll";
        container.style.width = "100%";
        this.selectionMenu.appendChild(container);

        for (const track in MUSIC_TRACK_NAMES) {
            let name = MUSIC_TRACK_NAMES[track];
            let b = <HTMLElement>document.createElement("div");
            b.style.backgroundColor = 'lightgray';
            b.style.width = "100%";
            b.innerText = name;
            b.onclick = (e) => {
                if (this.musicMode != "shuffle") {
                    this.musicMode = "manual";
                } else if (this.shuffleTimeout != 0) {
                    clearTimeout(this.shuffleTimeout);
                    this.shuffleTimeout = window.setTimeout(this.nextShuffle, 1 * 60 * 1000);
                }

                SETTINGS.setMusicTrackText("Transitioning...");
                this.setNextTrack(track);
            };

            container.appendChild(b);
            this.selectionOptions[track] = b;
        }
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        this.updateMusicUI();
    }

    initializeUI() {
        this.updateMusicUI();
    }

    updateMusicUI() {
        if (this.isPluginEnabled) {
            MUSIC_PLAYER.setNextTrack = (t) => {
                if (this.musicMode == "passthrough") {
                    this.setNextTrack(t);
                }
            };
            SETTINGS.DOM_music_text.onclick = (e) => {
                this.toggleDisplay();
            };
        } else {
            MUSIC_PLAYER.setNextTrack = this.originalSetTrack;
            SETTINGS.DOM_music_text.onclick = (e) => {};
            this.hideMusicSelection();
        }
    }

    enableShuffle() {
        if (this.musicMode != "shuffle") {
            this.previousMode = this.musicMode;
            this.musicMode = "shuffle";
            this.nextShuffle();
        }
    }

    disableShuffle() {
        if (this.musicMode == "shuffle") {
            this.musicMode = this.previousMode;
        }
    }

    nextShuffle() {
        if (this.musicMode == "shuffle") {
            var choices = Object.keys(this.selectionOptions);
            var track = choices[Math.floor(Math.random() * choices.length)];
            this.setNextTrack(track);
            this.shuffleTimeout = window.setTimeout(this.nextShuffle, 1 * 60 * 1000);
        }
    }

    logoutOK() {
        this.hideMusicSelection();
    }

    loginOK() {
        switch (this.musicMode) {
            case "passthrough":
                break;
            case "manual":
                if (this.currentTrack) {
                    this.setNextTrack(this.currentTrack);
                }
            case "shuffle":
                this.nextShuffle();
        }
    }

    setNextTrack(track: string) {
        if (this.currentSelection != null) {
            this.currentSelection.style.backgroundColor = 'lightgray';
        }

        var e = this.selectionOptions[track];
        if (e) {
            this.currentSelection = e;
            e.style.backgroundColor = 'green';
        }

        this.currentTrack = track;
        this.originalSetTrack.call(MUSIC_PLAYER, track);
    }

    toggleDisplay() {
        if (this.displayed) {
            this.hideMusicSelection();
        } else {
            this.displayMusicSelection();
        }
    }

    displayMusicSelection() {
        document.body.appendChild(this.selectionMenu);
        this.displayed = true;
    }

    hideMusicSelection() {
        this.selectionMenu.remove();
        this.displayed = false;
    }

}

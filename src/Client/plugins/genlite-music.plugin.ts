/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteMusicPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteMusicPlugin';
    static missingTracks = [
        "snow-relax",
    ];

    isPluginEnabled: boolean = false;
    uiTab: HTMLElement = null;
    originalSetTrack: Function;

    selectionOptions: { [key: string]: HTMLElement } = {};
    currentSelection: HTMLElement = null;
    nameDiv : HTMLElement = null;

    // plugin modes
    //   passthrough - default genfanad music
    //   manual      - manual select and repeat song
    //   shuffle     - change song every 3 min
    mode: "passthrough" | "manual" | "shuffle" = "passthrough";
    previousMode: "passthrough" | "manual" = "passthrough";
    shuffleTimeout = 0;
    currentTrack = "";

    history = [];
    historyIndex = 0;

    async init() {
        document.genlite.registerPlugin(this);
        this.originalSetTrack = document.game.MUSIC_PLAYER.setNextTrack;
        this.createCSS();

        const plugin = this;
        const controlNames = ['backward-step', 'shuffle', 'forward-step'];

        let settingsMenu = <HTMLElement>document.createElement("div");
        settingsMenu.classList.add("genlite-music-container");

        let current = <HTMLElement>document.createElement("div");
        current.classList.add("genlite-music-current");
        settingsMenu.appendChild(current);

        let anim = <HTMLElement>document.createElement("div");
        anim.classList.add("genlite-music-anim");
        anim.appendChild(document.createElement("span"));
        anim.appendChild(document.createElement("span"));
        anim.appendChild(document.createElement("span"));
        anim.appendChild(document.createElement("span"));
        current.appendChild(anim);

        this.nameDiv = <HTMLElement>document.createElement("div");
        this.nameDiv.classList.add("genlite-music-name");
        this.nameDiv.innerText = "";
        current.appendChild(this.nameDiv);

        // lets css center the name div
        let padding = <HTMLElement>document.createElement("div");
        padding.style.width = "26px";
        current.appendChild(padding);

        let controls = <HTMLElement>document.createElement("div");
        controls.classList.add("genlite-music-controls");
        for (const controlName of controlNames) {
            let button = <HTMLElement>document.createElement("div");
            button.id = `genlite-music-button-${controlName}`;
            button.innerHTML = `<i class="fas fa-${controlName}"></i>`;
            button.classList.add('genlite-music-control-button');
            button.onclick = function (e) {
                plugin.onControlClicked(controlName);
            };
            controls.appendChild(button);
        }
        settingsMenu.appendChild(controls);

        let trackList = <HTMLElement>document.createElement("div");
        trackList.classList.add('genlite-music-list');
        settingsMenu.appendChild(trackList);

        for (const track in document.game.MUSIC_TRACK_NAMES) {
            if (GenLiteMusicPlugin.missingTracks.includes(track)) {
                continue;
            }
            let name = document.game.MUSIC_TRACK_NAMES[track];
            let b = <HTMLElement>document.createElement("div");
            b.classList.add('genlite-music-track');
            b.innerText = name;
            b.onclick = function (e) {
                plugin.onTrackClicked(track);
            };
            trackList.appendChild(b);
            this.selectionOptions[track] = b;
        }

        this.uiTab = document.genlite.ui.addTab("music", "Music Selection", settingsMenu, this.isPluginEnabled);

        document.genlite.commands.register(
            "music",
            this.handleCommand.bind(this),
            this.helpCommand.bind(this)
        );
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Music Selection", null,  this.handlePluginState.bind(this));
    }

    createCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            .genlite-music-container {
                height: 20em;
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
                color: #ffd593;
                font-family: acme,times new roman,Times,serif;
                row-gap: 1em;
                padding: 1em;
            }

            .genlite-music-current {
                display: flex;
                column-gap: 1em;
                justify-content: center;
            }

            .genlite-music-anim {
                position: relative;
                bottom: 3px;
                width: 26px;
            }

            .genlite-music-anim span {
                width: 5px;
                height: 5px;
                bottom: 3px;
                position: absolute;
                background: rgb(66, 66, 66);
                -webkit-animation: bodong .75s infinite ease;
            }

            .genlite-music-anim span:first-child {
                left: 0px;
                -webkit-animation-delay: .1s;
            }

            .genlite-music-anim span:nth-child(2){
                left: 7px;
                -webkit-animation-delay: .4s;
            }

            .genlite-music-anim span:nth-child(3){
                left: 14px;
                -webkit-animation-delay: .2s;
            }

            .genlite-music-anim span:nth-child(4){
                left: 21px;
                -webkit-animation-delay: .6s;
            }

            @-webkit-keyframes bodong{  
                0%   {height:5px;  background:lawngreen;}  
                30%  {height:12px; background:lawngreen;}  
                60%  {height:15px; background:lawngreen;}  
                80%  {height:12px; background:lawngreen;}  
                100% {height:5px;  background:lawngreen;}  
            }

            .genlite-music-name {
            }

            .genlite-music-controls {
                display: flex;
                column-gap: 1em;
                justify-content: center;
            }

            .genlite-music-control-button {
                cursor: pointer;
            }

            #genlite-music-button-shuffle {
                color: gray;
            }

            .genlite-music-list {
                overflow-y: scroll;
                overflow-x: hidden;
                width: 100%;
                margin: auto;
                text-align: center;
            }

            .genlite-music-track {
                text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                background-color: #0e0c0b;
                padding: 2px;
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        this.updateMusicUI();
        
        // Hide uiTab if plugin is disabled
        if (this.uiTab) {
            this.uiTab.style.display = state ? "flex" : "none";
        }
    }

    loginOK() {
        this.nameDiv.innerText = document.game.MUSIC_TRACK_NAMES[
            document.game.MUSIC_PLAYER.currentTrackID
        ];
        switch (this.mode) {
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

    setNextTrack(track: string, appendHistory=true) {
        if (document.game.MUSIC_PLAYER.loading || document.game.MUSIC_PLAYER.fading) {
            return false;
        }

        if (this.currentSelection != null) {
            this.currentSelection.style.backgroundColor = '#0e0c0b';
        }

        var e = this.selectionOptions[track];
        if (e) {
            this.currentSelection = e;
            e.style.backgroundColor = 'lawngreen';
        }

        let len = this.history.length;
        let lastTrack = len ? this.history[len - 1] : "";
        if (appendHistory && lastTrack != track) {
            this.history.push(track);
            while (this.history.length > 20) {
                this.history.shift();
            }
            this.historyIndex = this.history.length - 1;
        }
        this.currentTrack = track;
        this.nameDiv.innerText = document.game.MUSIC_TRACK_NAMES[track];
        this.originalSetTrack.call(document.game.MUSIC_PLAYER, track);
        return true;
    }

    updateMusicUI() {
        if (this.isPluginEnabled) {
            document.game.MUSIC_PLAYER.setNextTrack = (t) => {
                if (this.mode == "passthrough") {
                    this.setNextTrack(t);
                }
            };
        } else {
            document.game.MUSIC_PLAYER.setNextTrack = this.originalSetTrack;
        }
    }

    onTrackClicked(track: string) {
        this.setManual();
        if (this.mode == "shuffle" && this.shuffleTimeout != 0) {
            clearTimeout(this.shuffleTimeout);
            this.shuffleTimeout = window.setTimeout(this.nextShuffle.bind(this), 3 * 60 * 1000);
        }

        document.game.SETTINGS.setMusicTrackText("Transitioning...");
        this.setNextTrack(track);
    }

    onControlClicked(control: string) {
        switch (control) {
            case "shuffle":
                if (this.mode === "shuffle") {
                    this.disableShuffle();
                } else {
                    this.enableShuffle();
                }
                break;
            case "forward-step":
                if (this.historyIndex < this.history.length - 1) {
                    if (this.setNextTrack(this.history[this.historyIndex + 1], false)) {
                        this.historyIndex++;
                    }
                } else if (this.mode === "shuffle") {
                    this.nextShuffle();
                }
                break;
            case "backward-step":
                if (this.historyIndex > 0) {
                    if (this.setNextTrack(this.history[this.historyIndex - 1], false)) {
                        this.historyIndex--;
                    }
                }
                break;
        }
    }

    setManual() {
        if (this.mode != "shuffle") {
            this.mode = "manual";
        }
    }

    enableShuffle() {
        if (this.mode != "shuffle") {
            let button = document.getElementById("genlite-music-button-shuffle");
            button.style.color = "lawngreen";
            this.previousMode = this.mode;
            this.mode = "shuffle";
            this.nextShuffle();
        }
    }

    disableShuffle() {
        if (this.mode == "shuffle") {
            let button = document.getElementById("genlite-music-button-shuffle");
            button.style.removeProperty("color");
            this.mode = this.previousMode;
        }
    }

    nextShuffle() {
        if (this.mode == "shuffle") {
            var choices = Object.keys(this.selectionOptions);
            var track = choices[Math.floor(Math.random() * choices.length)];
            this.setNextTrack(track);
            clearTimeout(this.shuffleTimeout);
            this.shuffleTimeout = window.setTimeout(this.nextShuffle.bind(this), 3 * 60 * 1000);
        }
    }

    helpCommand(args: string) {
        let end = args.indexOf(" ");
        if (end == -1) {
            end = args.length;
        }
        let subcommand = args.slice(0, end);

        switch (subcommand) {
            case "list":
                document.genlite.commands.print("List available tracks.");
                break;
            case "play":
                document.genlite.commands.print("Play a track; e.g. '//music play Genfanad Theme'");
                break;
            case "shuffle":
                document.genlite.commands.print("Enable or disable shuffle; e.g. '//music shuffle off'");
                break;
            case "default":
                document.genlite.commands.print("Restore to default Genfanad music");
                break;
            default:
                document.genlite.commands.print("Controls music player.");
                document.genlite.commands.print("subcommands: list, play, shuffle, default");
                break;
        }
    }

    handleCommand(args: string) {
        let end = args.indexOf(" ");
        if (end == -1) {
            end = args.length;
        }
        let subcommand = args.slice(0, end);
        let arg = args.slice(end + 1);

        switch (subcommand) {
            case "list":
                var names = [];
                for (const track in this.selectionOptions) {
                    names.push(this.selectionOptions[track].innerText);
                }
                document.genlite.commands.print(names.join(", "));
                break;
            case "play":
                let song = arg;
                if (song) {
                    // if it's a direct track name, play it
                    if (this.selectionOptions[song]) {
                        this.setManual();
                        this.setNextTrack(song);
                        document.genlite.commands.print("playing: " + song);
                        return;
                    }

                    // otherwise, look up full name
                    let tracks = [];
                    let matches = [];
                    for (const track in this.selectionOptions) {
                        let name = this.selectionOptions[track].innerText;
                        if (name.toLowerCase().startsWith(arg.toLowerCase())) {
                            tracks.push(track);
                            matches.push(name);
                        }
                    }

                    if (matches.length == 0) {
                        document.genlite.commands.print("no such song");
                    } else if (matches.length == 1) {
                        this.setManual();
                        this.setNextTrack(tracks[0]);
                        document.genlite.commands.print("playing: " + matches[0]);
                    } else {
                        document.genlite.commands.print("be more specific: " + matches.join(", "));
                    }
                } else {
                    document.genlite.commands.print("specify a track to play");
                    this.helpCommand("play");
                }
                break;
            case "shuffle":
                switch (arg) {
                    case "off":
                        this.disableShuffle();
                        break;
                    case "on":
                    default:
                        this.enableShuffle();
                        break;
                }
                break;
            case "default":
                this.mode = "passthrough";
                break;
            default:
                this.helpCommand("");
                break;
        }
    }

}

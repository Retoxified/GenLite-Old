/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteMusicPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteMusicPlugin';
    static missingTracks = [
        "snow-relax",
    ];

    isPluginEnabled: boolean = false;
    originalSetTrack: Function;

    selectionMenu: HTMLElement;
    displayed = false;

    selectionOptions: { [key: string]: HTMLElement } = {};
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
        document.genlite.registerPlugin(this);
        this.originalSetTrack = document.game.MUSIC_PLAYER.setNextTrack;

        this.isPluginEnabled = document.genlite.settings.add(
            "MusicPlugin.Enable",
            false,
            "Music Selection",
            "checkbox",
            this.handlePluginEnableDisable,
            this
        );

        this.selectionMenu = <HTMLElement>document.createElement("div");
        this.selectionMenu.style.position = "fixed";
        this.selectionMenu.style.right = "20px";
        this.selectionMenu.style.top = "20px";

        this.selectionMenu.style.height = "20em";
        this.selectionMenu.style.display = "flex";
        this.selectionMenu.style.flexDirection = "column";

        this.selectionMenu.style.color = "#ffd593";
        this.selectionMenu.style.borderTop = "2px solid #b54f08";
        this.selectionMenu.style.borderLeft = "2px solid #572008";
        this.selectionMenu.style.borderRight = "2px solid #572008";
        this.selectionMenu.style.borderBottom = "2px solid #250801";
        this.selectionMenu.style.fontFamily = "acme,times new roman,Times,serif";

        let header = <HTMLElement>document.createElement("div");
        header.innerText = "Music Selection";
        header.style.fontWeight = "bold";
        header.style.padding = "4px";
        header.style.textAlign = "center";
        header.style.textShadow = "-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000";
        header.style.backgroundColor = "#9c4209";
        header.style.color = "#fdda2e";
        this.selectionMenu.appendChild(header);

        let container = <HTMLElement>document.createElement("div");
        container.style.overflow = "scroll";
        container.style.width = "100%";
        this.selectionMenu.appendChild(container);

        for (const track in MUSIC_TRACK_NAMES) {
            if (GenLiteMusicPlugin.missingTracks.includes(track)) {
                continue;
            }
            let name = MUSIC_TRACK_NAMES[track];
            let b = <HTMLElement>document.createElement("div");
            b.style.backgroundColor = '#461400';
            b.style.width = "100%";
            b.innerText = name;
            b.onclick = (e) => {
                this.setManual();
                if (this.musicMode == "shuffle" && this.shuffleTimeout != 0) {
                    clearTimeout(this.shuffleTimeout);
                    this.shuffleTimeout = window.setTimeout(this.nextShuffle.bind(this), 3 * 60 * 1000);
                }

                SETTINGS.setMusicTrackText("Transitioning...");
                this.setNextTrack(track);
            };

            container.appendChild(b);
            this.selectionOptions[track] = b;
        }

        document.genlite.commands.register(
            "music",
            this.handleCommand.bind(this),
            this.helpCommand.bind(this)
        );
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
            document.game.MUSIC_PLAYER.setNextTrack = (t) => {
                if (this.musicMode == "passthrough") {
                    this.setNextTrack(t);
                }
            };
            SETTINGS.DOM_music_text.onclick = (e) => {
                this.toggleDisplay();
            };
        } else {
            document.game.MUSIC_PLAYER.setNextTrack = this.originalSetTrack;
            SETTINGS.DOM_music_text.onclick = (e) => { };
            this.hideMusicSelection();
        }
    }

    setManual() {
        if (this.musicMode != "shuffle") {
            this.musicMode = "manual";
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
            this.shuffleTimeout = window.setTimeout(this.nextShuffle.bind(this), 3 * 60 * 1000);
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
            this.currentSelection.style.backgroundColor = '#461400';
        }

        var e = this.selectionOptions[track];
        if (e) {
            this.currentSelection = e;
            e.style.backgroundColor = '#008000';
        }

        this.currentTrack = track;
        this.originalSetTrack.call(document.game.MUSIC_PLAYER, track);
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
                this.musicMode = "passthrough";
                break;
            default:
                this.helpCommand("");
                break;
        }
    }

}

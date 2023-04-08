/*
    Copyright (C) 2023 KKonaOG dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from "../interfaces/plugin.class";

export class GenLiteCommandsPlugin extends GenLitePlugin {
    public static pluginName = 'GenLiteCommandsPlugin';
    public static customCommandPrefix = '//';

    private commands: { [key: string]: CommandSpec } = {};
    private originalProcessInput: Function;

    async init() {
        document.genlite.registerPlugin(this);

        this.originalProcessInput = document.game.Chat.prototype.processInput;

        this.register("help", function (s) {
            if (!s) {
                let helpStr = Object.keys(document.genlite.commands.commands).join(", ");
                document.genlite.commands.print("GenLite Commands");
                document.genlite.commands.print(helpStr);
                return;
            }

            let end = s.indexOf(" ");
            if (end == -1) {
                // there is no space, use full string
                end = s.length;
            }
            let command = s.slice(0, end);
            let args = s.slice(end + 1);

            if (command in document.genlite.commands.commands) {
                let spec = document.genlite.commands.commands[command];
                if (spec.helpFunction) {
                    var text = spec.helpFunction(args);
                    if (text != null && text != "") {
                        document.genlite.commands.print(text);
                    }
                } else if (spec.helpText) {
                    document.genlite.commands.print(spec.helpText);
                } else {
                    document.genlite.commands.print("no help defined for this command");
                }
            } else {
                document.genlite.commands.print("no such command");
            }
        }, "display help text for a command: '//help <command>'");
    }

    handlePluginState(state: boolean): void {
        // TODO: Implement
    }

    processInput(plugin, originalFunction) {
        const self = (this as any);

        let text = self.DOM_input.value;
        if (text.startsWith(GenLiteCommandsPlugin.customCommandPrefix)) {
            self.DOM_input.value = '';
            plugin.handleCommand(text);
        } else {
            originalFunction.bind(self)();
        }
    }

    public loginOK() {
        document.game.CHAT.processInput = this.processInput.bind(
            document.game.CHAT,
            this,
            this.originalProcessInput,
        );
    }

    initializeUI() {
        this.print("Genlite Commands Loaded type //help to see list of commands");
    }

    public handleCommand(text: string) {
        let end = text.indexOf(" ");
        if (end == -1) {
            // there is no space, use full string
            end = text.length;
        }
        let command = text.slice(GenLiteCommandsPlugin.customCommandPrefix.length, end);
        let args = text.slice(end + 1);
        if (command in this.commands) {
            let spec = this.commands[command];
            if (spec.echo) {
                this.print(text);
            }
            spec.handler(args);
        } else {
            let helpStr = Object.keys(document.genlite.commands.commands).join(" ");
            this.print("invalid command\"" + command + "\". Options: " + helpStr);
        }
    }

    public register(
        command: string,
        handler: (a: string) => void,
        help: any = null,
        echo: boolean = true,
    ): CommandSpec {
        if (command in this.commands || command.includes(" ")) {
            // command is already registered or invalid
            return null;
        }

        let spec: CommandSpec = null;
        if (typeof help === 'function') {
            spec = {
                command: command,
                handler: handler,
                helpText: null,
                helpFunction: help,
                echo: echo,
            };
        } else if (typeof help === 'string') {
            spec = {
                command: command,
                handler: handler,
                helpText: help,
                helpFunction: null,
                echo: echo,
            };
        } else {
            spec = {
                command: command,
                handler: handler,
                helpText: null,
                helpFunction: null,
                echo: echo,
            };
        }

        this.commands[command] = spec;
        return spec;
    }

    public remove(command: string): boolean {
        if (command in this.commands) {
            delete this.commands[command];
            return true;
        }
        return false;
    }

    public print(text: string) {
        // document.game.CHAT.addGameMessage assigns directly to innerHTML. To avoid any
        // possible code injection, let text area do our string escaping.
        let e = document.createElement('textarea');
        e.textContent = text;
        document.game.CHAT.addGameMessage(e.innerHTML);
    }

}

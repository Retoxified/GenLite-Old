export class GenLiteCommandsPlugin {
    public static pluginName = 'GenLiteCommandsPlugin';
    public static customCommandPrefix = '//';

    private commands: {[key: string]: CommandSpec} = {};
    private originalProcessInput: Function;

    async init() {
        window.genlite.registerModule(this);

        this.originalProcessInput = Chat.prototype.processInput;
        this.register("help", function (s) {
            if (!s) {
                let helpStr = Object.keys(window.genlite.commands.commands).join(", ");
                window.genlite.commands.print("GenLite Commands");
                window.genlite.commands.print(helpStr);
                return;
            }

            let end = s.indexOf(" ");
            if (end == -1) {
                // there is no space, use full string
                end = s.length;
            }
            let command = s.slice(0, end);
            let args = s.slice(end + 1);

            if (command in window.genlite.commands.commands) {
                let spec = window.genlite.commands.commands[command];
                if (spec.helpFunction) {
                    var text = spec.helpFunction(args);
                    if (text != null && text != "") {
                        window.genlite.commands.print(text);
                    }
                } else if (spec.helpText) {
                    window.genlite.commands.print(spec.helpText);
                } else {
                    window.genlite.commands.print("no help defined for this command");
                }
            } else {
                window.genlite.commands.print("no such command");
            }
        }, "display help text for a command: '//help <command>'");
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
        CHAT.processInput = this.processInput.bind(
            CHAT,
            this,
            this.originalProcessInput,
        );
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
            let helpStr = Object.keys(window.genlite.commands.commands).join(" ");
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

        let spec : CommandSpec = null;
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
        // CHAT.addGameMessage assigns directly to innerHTML. To avoid any
        // possible code injection, let text area do our string escaping.
        let e = document.createElement('textarea');
        e.textContent = text;
        CHAT.addGameMessage(e.innerHTML);
    }

}

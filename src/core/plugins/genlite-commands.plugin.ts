export class GenLiteCommandsPlugin {
    public static pluginName = 'GenLiteCommandsPlugin';
    public static customCommandPrefix = '//';

    private commands: {[key: string]: (a: string) => void} = {};
    private originalProcessInput: Function;

    async init() {
        window.genlite.registerModule(this);

        this.originalProcessInput = Chat.prototype.processInput;
        this.register("help", function (s) {
            let helpStr = Object.keys(window.genlite.commands.commands).join(" ");
            window.genlite.commands.print("GenLite Commands");
            window.genlite.commands.print(helpStr);
        });
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
            CHAT.addGameMessage(text);
            this.commands[command](args);
        } else {
            let helpStr = Object.keys(window.genlite.commands.commands).join(" ");
            this.print("invalid command\"" + command + "\". Options: " + helpStr);
        }
    }

    public register(command: string, handler: (a: string) => void): boolean {
        if (command in this.commands || command.includes(" ")) {
            // command is already registered
            return false;
        }

        this.commands[command] = handler;
        return true;
    }

    public print(text: string) {
        CHAT.addGameMessage(text);
    }

}

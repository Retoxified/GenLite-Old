import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteChatPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteChatPlugin';

    static gameMessagesToIgnore: Set<string> = new Set<string>([
        "You start mining the rock.",
        "You fail to get some ore.",
        "You get some ore.",
        "You stop mining the rock.",
        "The rock is out of ore.",
    ]);

    filterGameMessages: boolean = false;
    originalGameMessage: Function;

    async init() {
        window.genlite.registerPlugin(this);
        this.filterGameMessages = window.genlite.settings.add(
            "Chat.FilterGameMessages",
            false,
            "Filter Game Chat",
            "checkbox",
            this.handleFilterGameMessages,
            this
        );
    }

    public loginOK() {
        this.originalGameMessage = CHAT.addGameMessage;
        this.updateState();
    }

    handleFilterGameMessages(state: boolean) {
        this.filterGameMessages = state;
        this.updateState();
    }

    updateState() {
        if (this.filterGameMessages) {
            CHAT.addGameMessage = this.newGameMessage.bind(
                CHAT,
                this.originalGameMessage
            );
        } else {
            CHAT.addGameMessage = this.originalGameMessage;
        }
    }

    newGameMessage(original, text) {
        if (!GenLiteChatPlugin.gameMessagesToIgnore.has(text)) {
            original.bind(this)(text);
        }
    }

    ignoreGameMessage(text) {
        GenLiteChatPlugin.gameMessagesToIgnore.add(text);
    }

    stopIgnoringGameMessage(text) {
        GenLiteChatPlugin.gameMessagesToIgnore.delete(text);
    }

}

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

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
    static storageKey = 'IgnoredGameChatMessages';

    static gameMessagesToIgnore: Set<string> = new Set<string>([
        "You start mining the rock.",
        "You fail to get some ore.",
        "You get some ore.",
        "You stop mining the rock.",
        "The rock is out of ore.",
        "Your inventory is full",
        "Might have some useful ore inside.",
    ]);

    customMessagesToIgnore: Set<string> = new Set<string>();

    filterGameMessages: boolean = false;
    originalGameMessage: Function;

    async init() {
        document.genlite.registerPlugin(this);
        this.filterGameMessages = document.genlite.settings.add(
            "Chat.FilterGameMessages",
            false,
            "Filter Game Chat",
            "checkbox",
            this.handleFilterGameMessages,
            this
        );
        this.customMessagesToIgnore = this.loadSavedSettings();
    }

    public loginOK() {
        this.originalGameMessage = document.game.CHAT.addGameMessage;
        this.updateState();
    }

    handleFilterGameMessages(state: boolean) {
        this.filterGameMessages = state;
        this.updateState();
    }

    updateState() {
        if (this.filterGameMessages) {
            document.game.CHAT.addGameMessage = this.newGameMessage.bind(
                document.game.CHAT,
                this,
                this.originalGameMessage
            );
        } else {
            document.game.CHAT.addGameMessage = this.originalGameMessage;
        }
    }

    newGameMessage(plugin, original, text) {
        let ignore = (
            GenLiteChatPlugin.gameMessagesToIgnore.has(text) ||
            plugin.customMessagesToIgnore.has(text)
        );
        if (!ignore) {
            let dom = original.bind(this)(text);
            if (dom && !dom.add_interactions) {
                dom.add_interactions = (list) => {
                    list.push({
                        color: 'red',
                        blockLeftClick: true,
                        priority: 1,
                        object: null,
                        text: 'Ignore This Message',
                        action: () => {
                            plugin.ignoreGameMessage(dom.lastChild.innerHTML);
                        },
                    });
                };
            }
        }
    }

    ignoreGameMessage(text) {
        this.customMessagesToIgnore.add(text);
        this.saveSettings();
    }

    stopIgnoringGameMessage(text) {
        this.customMessagesToIgnore.delete(text);
        this.saveSettings();
    }

    loadSavedSettings() {
        let s = localStorage.getItem(GenLiteChatPlugin.storageKey);
        var c : string[] = JSON.parse(s);
        if (!c) {
            c = [];
        }
        return new Set(c);
    }

    saveSettings() {
        let s = this.customMessagesToIgnore;
        console.log('saving', s);
        localStorage.setItem(
            GenLiteChatPlugin.storageKey,
            JSON.stringify(Array.from(s))
        );
    }

}

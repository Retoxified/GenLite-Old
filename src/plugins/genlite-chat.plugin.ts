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

/*
 * Chat plugin order of operations
 *  - message is received
 *  - if channel is 'game' and filter game chat enabled and text matches filter
 *       then message is discarded entirely.
 *  - if preserve chat log is enabled
 *       then message is saved to indexedDB
 *  - if condense is enabled and text matches previous message
 *       then new message is updated with a count
 *       and the previous one is discarded
 *  - if not discarded above, add to chat
 *
 */

class GenLiteMessageBuffer {

    channel: string;
    buffer: MessageBuffer;
    originalAdd: (message: HTMLElement, timestamp: string) => void;

    constructor(name: string, buffer: MessageBuffer) {
        this.channel = name;
        this.buffer = buffer;
        this.originalAdd = buffer.add;
    }

    public hook() {
        let plugin = this;
        this.buffer.add = this.overrideAdd.bind(this.buffer, this);
    }

    public unhook() {
        this.buffer.add = this.originalAdd;
    }

    overrideAdd(
        glbuffer: GenLiteMessageBuffer,
        message: HTMLElement,
        timestamp: string
    ) {
        // roundabout casting to MessageBuffer because this is used to
        // override MessageBuffer.add
        let self = ((this as any) as MessageBuffer);
        let plugin = document[GenLiteChatPlugin.pluginName];

        // This class overrides MessageBuffer which operates on HTML
        // elements, so we need to parse the specific fields ouf of the
        // element. We could override methods on Chat instead to avoid
        // this, but then we'd conflict with other chat features and
        // require a separate override per chat channel.

        // the current element structure is:
        // <div: message>
        //  <span: timestamp>
        //  ?<span: imgwrapper><img: icon>
        //  ?<span: speaker>
        //  <span: text>

        let speaker: string = null;
        let elements = message.getElementsByClassName('new_ux-message-user');
        if (elements.length === 1) {
            let e = elements[0] as HTMLElement;
            speaker = e.innerText;
            speaker = speaker.substring(0, speaker.length - 1); // trim colon
        }

        let content = message.getElementsByClassName(
            'new_ux-message-text'
        )[0].innerHTML;

        if (plugin.preserveMessages) {
            glbuffer.storeMessage(speaker, content, timestamp);
        }

        if (plugin.condenseMessages) {
            // TODO: optimize a bit
            for (const existing of self.messages) {
                let es = existing.message.getElementsByClassName('new_ux-message-text');
                let existingContent = es[0].innerHTML;

                es = existing.message.getElementsByClassName('new_ux-message-user');
                let existingSpeaker = es.length > 0 ? (es[0] as HTMLElement).innerText : null;

                if (existingContent === content && existingSpeaker === speaker) {
                    let countElements = existing.message.getElementsByClassName('genlite-message-counter');
                    let count: HTMLElement = null;
                    if (countElements.length > 0) {
                        count = countElements[0] as HTMLElement;
                    } else {
                        count = document.createElement('span')
                        count.classList.add('genlite-message-counter');
                        count.style.float = 'right';
                        count.innerText = '(1)';
                        existing.message.appendChild(count);
                    }

                    let text = count.innerText;
                    let number = parseInt(text.substr(1, text.length - 2)) + 1; // trim parens
                    count.innerText = '(' + number + ')';

                    // move count to the new element
                    count.remove();
                    message.appendChild(count);

                    // remove from MessageBuffer
                    self.messages.splice(self.messages.indexOf(existing), 1);

                    // remove the old message element
                    existing.message.remove();

                    // and remove it from CHAT's internal buffer
                    let index = document.game.CHAT.chat_buffer.indexOf(existing.message);
                    if (index >= 0) {
                        document.game.CHAT.chat_buffer.splice(index, 1);
                    }

                    break;
                }
            }
        }

        glbuffer.originalAdd.bind(self)(message, timestamp);
    };

    storeMessage(
        speaker: string,
        text: string,
        timestamp: string,
    ) {
        // don't preserve game messages
        if (this.channel === "game") return;

        document.genlite.database.storeTx(
            'chatlog',
            'readwrite',
            (store) => {
                store.put({
                    channel: this.channel,
                    timestamp: timestamp,
                    speaker: speaker,
                    text: text,
                });
            }
        );
    }

}

export class GenLiteChatPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteChatPlugin';
    static storageKey = 'IgnoredGameChatMessages';

    // 20 minutes in milliseconds
    static preserveChatLogDelta = 1200000;

    pluginSettings : Settings = {
        // Checkbox Example
        "Condense Messages": {
            type: 'checkbox',
            oldKey: 'GenLite.Chat.CondenseMessages',
            value: false,
            stateHandler: this.handleCondenseMessages.bind(this)
        },
        "Filter Game Messages": {
            type: 'checkbox',
            oldKey: 'GenLite.Chat.FilterGameMessages',
            value: false,
            stateHandler: this.handleFilterGameMessages.bind(this)
        },
        "Color Private Messages": {
            type: 'checkbox',
            value: true,
            stateHandler: this.handleColorPrivateMessages.bind(this),
            children: {
                "Read Message Color": {
                    type: "color",
                    value: "#ADD8E6",
                    stateHandler: this.handleReadColorChange.bind(this),
                },
                "Unread Message Color": {
                    type: "color",
                    value: "#00FFFF",
                    stateHandler: this.handleUnreadColorChange.bind(this),
                },
                "Sent Message Color": {
                    type: "color",
                    value: "#D0D04B",
                    stateHandler: this.handleSentColorChange.bind(this),
                }
            }
        },
    };
    
    customMessagesToIgnore: Set<string> = new Set<string>();

    newPMColor = '#00FFFF';
    oldPMColor = '#ADD8E6';
    sentPMColor = '#D0D04B';
    colorPrivateMessages: boolean = false;

    filterGameMessages: boolean = false;
    preserveMessages: boolean = false;
    condenseMessages: boolean = false;
    originalGameMessage: (text: string) => HTMLElement;
    originalAddPrivateMessage: (timestamp, speaker, text, icon, loopback, name) => HTMLElement;

    indexedDBSupported = false;
    bufferHooked: boolean = false;
    buffers: Record<string, GenLiteMessageBuffer> = {};

    isPluginEnabled = true;

    async init() {
        document.genlite.registerPlugin(this);
        this.originalGameMessage = document.game.CHAT.addGameMessage;
        this.originalAddPrivateMessage = document.game.CHAT.addPrivateMessage;

        document.genlite.database.add((db) => {
            let store = db.createObjectStore('chatlog', {
                keyPath: 'key',
                autoIncrement: true
            });
            store.createIndex('indexKey', 'key', {unique: true});
        });

        this.indexedDBSupported = 'indexedDB' in window;
        if (this.indexedDBSupported) {
            this.pluginSettings['Preserve Messages'] = {
                type: 'checkbox',
                oldKey: 'GenLite.Chat.PreserveMessages',
                value: false,
                stateHandler: this.handlePreserveMessages.bind(this)
            };
        } else {
            this.preserveMessages = false;
            console.log(
                '%c IndexedDB is not supported, cannot save chat logs',
                'color:red'
            );
        }

        this.customMessagesToIgnore = this.loadSavedSettings();
        document.genlite.commands.register(
            'log',
            this.handleCommand.bind(this),
            this.helpCommand.bind(this)
        );
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Chat Filtering", null, this.handlePluginState.bind(this), this.pluginSettings);
        if (this.preserveMessages) {
            // I'm just hacking this together until the init order refactor
            setTimeout(this.refillChatBox.bind(this), 500);
        }
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        this.updateState();
    }

    public loginOK() {
        this.updateState();
    }

    refillChatBox() {
        this.getRecentMessages(GenLiteChatPlugin.preserveChatLogDelta, (ms) => {

            function getText(dom) {
                let text = "";
                let elements = dom.getElementsByClassName("new_ux-message-text");
                if (elements) {
                    text = (elements[0] as HTMLElement).innerText; // should be innerhtml?
                }
                return text;
            }

            function getSpeaker(dom) {
                let speaker: string = null;
                let elements = dom.getElementsByClassName('new_ux-message-user');
                if (elements.length === 1) {
                    let e = elements[0] as HTMLElement;
                    speaker = e.innerText;
                    speaker = speaker.substring(0, speaker.length - 1); // trim colon
                }
                return speaker;
            }

            // save messages that came in so far
            let existing_messages: Array<IDBMessage> = [];

            for (const m of document.game.CHAT.filter_buttons["game"].buffer.messages) {
                existing_messages.push({
                    channel: "game",
                    text: getText(m.message),
                    timestamp: m.timestamp,
                    speaker: null,
                });
            }
            for (const m of document.game.CHAT.filter_buttons["public"].buffer.messages) {
                existing_messages.push({
                    channel: "public",
                    text: getText(m.message),
                    timestamp: m.timestamp,
                    speaker: getSpeaker(m.message),
                });
            }
            for (const m of document.game.CHAT.filter_buttons["private"].buffer.messages) {
                existing_messages.push({
                    channel: "private",
                    text: getText(m.message),
                    timestamp: m.timestamp,
                    speaker: getSpeaker(m.message),
                });
            }

            // clear chat box
            document.game.CHAT.clear();

            // temporarily disable preservation so we don't double-store
            let plugin = document['GenLiteChatPlugin'];
            let prevValue = plugin.preserveMessages;
            plugin.preserveMessages = false;
            for (const m of ms.concat(existing_messages)) {
                document.game.CHAT.addMessage(
                    m.channel,
                    m.timestamp,
                    m.speaker,
                    m.text,
                    false
                );
            }
            plugin.preserveMessages = prevValue;
        });
    }

    handleFilterGameMessages(state: boolean) {
        this.filterGameMessages = state;
        this.updateState();
    }

    handleColorPrivateMessages(state: boolean) {
        this.colorPrivateMessages = state;

        let messages = document.getElementsByClassName("new_ux-private-message");
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i] as HTMLElement;
            let users = message.getElementsByClassName("new_ux-message-user");
            if (users.length) {
                let name = (users[0] as HTMLElement).innerText;
                if (name.includes("(PM from ")) {
                    // we don't know if it's been read, so default to yes
                    if (state) message.style.color = this.oldPMColor;
                    else message.style.removeProperty("color");
                } else if (name.includes("(PM to ")) {
                    if (state) message.style.color = this.sentPMColor;
                    else message.style.removeProperty("color");
                }
            }
        }
    }

    handleReadColorChange(color: string) {
        const prevColor = this.oldPMColor;
        const fromHeader = "(PM from ";
        this.oldPMColor = color;

        let messages = document.getElementsByClassName("new_ux-private-message");
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i] as HTMLElement;
            let users = message.getElementsByClassName("new_ux-message-user");
            if (users.length && (users[0] as HTMLElement).innerText.includes(fromHeader)) {
                if (message.style.color === prevColor) {
                    message.style.color = this.oldPMColor;
                }
            }
        }
    }

    handleUnreadColorChange(color: string) {
        const prevColor = this.newPMColor;
        const fromHeader = "(PM from ";
        this.newPMColor = color;
        let messages = document.getElementsByClassName("new_ux-private-message");
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i] as HTMLElement;
            let users = message.getElementsByClassName("new_ux-message-user");
            if (users.length && (users[0] as HTMLElement).innerText.includes(fromHeader)) {
                if (message.style.color === prevColor) {
                    message.style.color = this.newPMColor;
                }
            }
        }
    }

    handleSentColorChange(color: string) {
        this.sentPMColor = color;
        const toHeader = "(PM to ";
        let messages = document.getElementsByClassName("new_ux-private-message");
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i] as HTMLElement;
            let users = message.getElementsByClassName("new_ux-message-user");
            if (users.length && (users[0] as HTMLElement).innerText.includes(toHeader)) {
                message.style.color = this.sentPMColor;
            }
        }
    }

    handleCondenseMessages(state: boolean) {
        this.condenseMessages = state;
        this.updateState();
    }

    handlePreserveMessages(state: boolean) {
        this.preserveMessages = state;
        this.updateState();
    }

    updateState() {
        if (this.isPluginEnabled) {
            this.hookBuffer();

        } else {
            this.unhookBuffer();
        }

        if (this.isPluginEnabled && this.filterGameMessages) {
            document.game.CHAT.addGameMessage = this.newGameMessage.bind(
                document.game.CHAT,
                this,
                this.originalGameMessage
            );
        } else {
            document.game.CHAT.addGameMessage = this.originalGameMessage;
        }

        if (this.isPluginEnabled && this.colorPrivateMessages) {
            let plugin = this;
            document.game.CHAT.addPrivateMessage = function (e,speaker,n,i,a,r) {
                let dom = plugin.originalAddPrivateMessage.bind(this)(e,speaker,n,i,a,r);
                plugin.colorPrivateMessage(speaker, dom);
                return dom;
            };
        } else {
            document.game.CHAT.addPrivateMessage = this.originalAddPrivateMessage;
        }

    }

    hookBuffer() {
        if (!this.bufferHooked) {
            for (const channel in document.game.CHAT.filter_buttons) {
                let buffer = document.game.CHAT.filter_buttons[channel].buffer;
                let glbuffer = new GenLiteMessageBuffer(channel, buffer);
                this.buffers[channel] = glbuffer;
                glbuffer.hook();
            }
            this.bufferHooked = true;
        }
    }

    unhookBuffer() {
        if (this.bufferHooked) {
            for (const channel in this.buffers) {
                this.buffers[channel].unhook();
            }
            this.bufferHooked = false;
        }
    }

    colorPrivateMessage(speaker, dom: HTMLElement) {
        const pmHeader = "(PM to ";
        if (speaker.includes(pmHeader)) {
            dom.style.color = this.sentPMColor;
            let sentTo = speaker.substring(pmHeader.length, speaker.length - 1);
            let fromHeader = "(PM from " + sentTo + ")";
            let messages = document.getElementsByClassName("new_ux-private-message");
            for (let i = 0; i < messages.length; i++) {
                let message = messages[i] as HTMLElement;
                let users = message.getElementsByClassName("new_ux-message-user");
                if (users.length && (users[0] as HTMLElement).innerText.includes(fromHeader)) {
                    message.style.color = this.oldPMColor;
                }
            }
        } else {
            // for received messages, recolor
            dom.style.color = this.newPMColor;
        }
    }

    newGameMessage(plugin, original, text) {
        if (!plugin.customMessagesToIgnore.has(text)) {
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
                            let content = dom.getElementsByClassName(
                                'new_ux-message-text'
                            )[0].innerHTML;
                            plugin.ignoreGameMessage(content);
                        },
                    });
                    // list.push({
                    //     color: 'red',
                    //     blockLeftClick: true,
                    //     priority: 1,
                    //     object: null,
                    //     text: 'Delete This Message',
                    //     action: () => {
                    //         // Note: this only hides the element, it is not
                    //         // removed from the internal chat buffer or indexeddb
                    //         dom.remove();
                    //     },
                    // });
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
        localStorage.setItem(
            GenLiteChatPlugin.storageKey,
            JSON.stringify(Array.from(s))
        );
    }

    getRecentMessages(
        delta: number,
        callback: (m: Array<IDBMessage>) => void
    ) {
        const endTime = Date.now() - delta;
        let messages = [];
        let store = document.genlite.database.storeTx(
            'chatlog',
            'readonly',
            (store) => {
                store.openCursor(null, 'prev').onsuccess = (e) => {
                    const cursor = e.target.result;
                    let message = cursor.value;
                    if (message.timestamp >= endTime) {
                        messages.unshift(message);
                        cursor.continue();
                    } else {
                        callback(messages);
                    }
                };
            }
        );
    }

    handleCommand(args: string) {
        let end = args.indexOf(' ');
        if (end == -1) {
            end = args.length;
        }
        let subcommand = args.slice(0, end);
        let arg = args.slice(end + 1);

        if (!document.genlite.database.supported) {
            document.genlite.commands.print('Chat DB not available.');
            document.genlite.commands.print('Enable "preserve chat log" in settings.');
            return;
        }

        switch (subcommand) {
            case 'size':
                let store = document.genlite.database.storeTx(
                    'chatlog',
                    'readonly',
                    (store) => {
                        let cursor = store.openCursor(null, 'prev');
                        cursor.onsuccess = (e: any) => {
                            let maxKey = e.target.result.value.key;
                            document.genlite.commands.print('Chat messages saved: ' + maxKey);
                        };
                    }
                );
                break;
            default:
                this.helpCommand('');
                break
        }
    }

    helpCommand(args: string) {
        let end = args.indexOf(' ');
        if (end == -1) {
            end = args.length;
        }
        let subcommand = args.slice(0, end);
        let arg = args.slice(end + 1);

        switch (subcommand) {
            case 'size':
                document.genlite.commands.print('size of saved chat log');
                break;
            default:
                document.genlite.commands.print('subcommands: size');
                break;
        }
    }

}

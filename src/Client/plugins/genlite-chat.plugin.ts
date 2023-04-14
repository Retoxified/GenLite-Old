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

interface PrivateMessage {
    text: string;
    sent: boolean;
}

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

        if (glbuffer.channel === "private") {
            // TODO: colors will break here, but we shouldn't use innerHTML
            plugin.uiTrimAndAddMessage(speaker, content);
        } else if (glbuffer.channel === "public") {
            plugin.uiAddPublicMessage(speaker, content);
        }

        if (plugin.preserveMessages) {
            glbuffer.storeMessage(speaker, content, timestamp);
        }

        if (plugin.condenseMessages) {
            // TODO: optimize a bit
            // loop through backwards so that we dedupe with most recent instance of a message;
            for (let i = self.messages.length - 1; i >= 0; i--) {
                const existing = self.messages[i];

                let es = existing.message.getElementsByClassName('new_ux-message-text');
                let existingContent = es[0].innerHTML;

                es = existing.message.getElementsByClassName('new_ux-message-user');
                let existingSpeaker = es.length > 0 ? (es[0] as HTMLElement).innerText : null;
                if (existingSpeaker) {
                    existingSpeaker = existingSpeaker.substring(0, existingSpeaker.length - 1); // trim colon
                }

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

    pluginSettings: Settings = {
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
        "Mark Public Chat As Read": {
            type: 'checkbox',
            value: false,
            stateHandler: this.handleMarkPublicRead.bind(this)
        },
    };

    // privates ui
    uiTab: HTMLElement = null;
    uiNotif: HTMLElement = null;

    searchRow: HTMLElement = null;
    settingsMenu: HTMLElement = null;
    listContainer: HTMLElement = null;
    chatUIs: Record<string, HTMLElement> = {};
    chatRows: Record<string, HTMLElement> = {};

    openChat: string = null;
    lastPublicSpeaker: string = null;
    privateLogs: Record<string, PrivateMessage> = {};

    customMessagesToIgnore: Set<string> = new Set<string>();

    newPMColor = '#00FFFF';
    oldPMColor = '#ADD8E6';
    sentPMColor = '#D0D04B';
    colorPrivateMessages: boolean = false;

    filterGameMessages: boolean = false;
    preserveMessages: boolean = false;
    cacheProfilePics: boolean = false;
    condenseMessages: boolean = false;
    originalGameMessage: (text: string) => HTMLElement;
    originalAddPrivateMessage: (timestamp, speaker, text, icon, loopback, name) => HTMLElement;
    markPublicRead: boolean = false;

    preserveMinutes = 20;

    indexedDBSupported = false;
    bufferHooked: boolean = false;
    buffers: Record<string, GenLiteMessageBuffer> = {};

    isPluginEnabled = true;

    async init() {
        document.genlite.registerPlugin(this);
        this.originalGameMessage = document.game.CHAT.addGameMessage;
        this.originalAddPrivateMessage = document.game.CHAT.addPrivateMessage;

        document.genlite.database.add((db) => {
            if (db.objectStoreNames.contains('chatlog')) return;
            let store = db.createObjectStore('chatlog', {
                keyPath: 'key',
                autoIncrement: true
            });
            store.createIndex('indexKey', 'key', { unique: true });
        });
        document.genlite.database.add((db) => {
            if (db.objectStoreNames.contains('profiles')) return;
            let store = db.createObjectStore('profiles', {
                keyPath: 'name',
            });
        });

        this.indexedDBSupported = 'indexedDB' in window;
        if (this.indexedDBSupported) {
            this.pluginSettings['Preserve Messages'] = {
                type: 'checkbox',
                oldKey: 'GenLite.Chat.PreserveMessages',
                value: false,
                stateHandler: this.handlePreserveMessages.bind(this),
                children: {
                    'Preserve for (Minutes)': {
                        type: 'range',
                        value: 20,
                        min: 10,
                        max: 2 * 60,
                        step: 10,
                        stateHandler: this.handlePreserveMinutes.bind(this),
                    }
                },
            };
            this.pluginSettings['Cache Profile Pics'] = {
                type: 'checkbox',
                value: true,
                stateHandler: this.handleCacheProfilePics.bind(this),
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
        this.createCSS();
        this.createUITab();
        document.genlite.ui.registerPlugin("Chat Filtering", null, this.handlePluginState.bind(this), this.pluginSettings);
        if (this.preserveMessages) {
            // I'm just hacking this together until the init order refactor
            setTimeout(this.refillChatBox.bind(this), 500);
        }
    }

    createCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            .genlite-chat-container {
                display: flex;
                flex-direction: column;
                overflow-x: hidden;
                color: #ffd593;
                font-family: acme,times new roman,Times,serif;
                height: 100%;
            }

            .genlite-chat-search-row {
                width: 100%;
                height: 25px;
                border-bottom: 1px solid rgb(66, 66, 66);
                display: flex;
                align-items: center;
            }

            .genlite-chat-search {
                background-color: rgb(42, 40, 40);
                color: rgb(255, 255, 255);
                font-size: 16px;
                border-radius: 0px;
                padding-left: 10px;
                padding-right: 10px;
                box-sizing: border-box;
                outline: none;
                width: 100%;
                border: medium none;
                margin-left: auto;
                margin-right: auto
            }

            .genlite-chats-list {
                display: flex;
                flex-direction: column;
                overflow-y: scroll;
                height: 100%;
                padding: 1em;
                row-gap: 1em;
            }

            .genlite-chat-row-public {
                justify-content:center;
                background-color: rgb(44,44,44);
            }

            .genlite-chat-row-public .genlite-chat-profile {
                display: none;
            }

            .genlite-chat-row {
                padding: 0.5em;
                display: flex;
                border-radius: 10px;
                background-color: rgb(33,33,33);
                box-shadow: -2px 2px rgb(10, 10, 10), 2px -2px rgb(60, 60, 60);
                align-items: center;
                column-gap: 1em;
                cursor: pointer;
                position: relative;
            }

            .genlite-chat-row-unread {
                box-shadow:  2px -2px rgb(0, 255, 255), -2px 2px rgb(0, 127, 127), -2px -2px rgb(0, 200, 200), 2px 2px rgb(0, 200, 200)
            }

            .genlite-chat-profile {
                position: relative;
                width: 64px;
                height: 64px;
            }

            .genlite-chat-profile-bg {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-size: 100%;
                z-index: 2;
            }

            .genlite-chat-profile-pic {
                position: absolute;
                left: 8%;
                top: 8%;
                width: 80%;
                height: 80%;
                z-index: 1;
                border-radius: 50%;
                background-clip: content-box;
            }

            .genlite-chat-name {
                color: goldenrod;
                text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                font-size: 1em;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }

            .genlite-chat-badge {
                height: 1em;
                width: 1em;
                border-radius: 50%;
                border: 2px solid white;
                background-color: lawngreen;
                position: absolute;
                right: 0;
                top: 0;
                visibility: hidden;
                z-index: 3;
            }

            .genlite-chat-interface {
                display: none;
                flex-direction: column;
                height: 100%;
                overflow-y: hidden;
                row-gap: 1em;
                padding-bottom: 2em;
                padding-top: 1em;
            }

            .genlite-chat-title {
                color: goldenrod;
                text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                font-size: 1.5em;
                text-align: center;
                padding-left: 1.25em;
                padding-right: 1.25em;
                position: relative;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .genlite-chat-back {
                position: absolute;
                color: white;
                left: 0.25em;
                top: 0;
            }

            .genlite-chat-messages-list {
                padding: 0.5em;
                row-gap: 0.5em;
                display: flex;
                flex-direction: column-reverse;
                overflow-y: scroll;
                border-bottom: 1px solid rgb(66, 66, 66);
                border-top: 1px solid rgb(0, 0, 0);
                flex-grow: 1;
            }

            .genlite-chat-message-author {
                color: white;
                font-size: 0.8em;
                transform: translateY(0.5em);
            }

            .genlite-chat-message {
                padding: 0.5em;
                border-radius: 5px;
                background-color: rgb(33,33,33);
                width: fit-content;
                min-width: 45%;
                max-width: 75%;
            }

            .genlite-chat-message-sent {
                padding: 0.5em;
                border-radius: 5px;
                background-color: rgb(33,66,66);
                margin-left: auto;
                text-align: left;
            }

            .genlite-chat-input {
                border: none;
                padding: 0.25em;
                background-color: rgb(66,66,66);
                margin-right: 1em;
                margin-left: 1em;
                display: none;
                flex-shrink: 0;
            }
        `;
        document.head.appendChild(style);
    }

    createUITab() {
        if (this.uiTab) {
            this.uiTab.remove();
        }

        this.settingsMenu = <HTMLElement>document.createElement("div");
        this.settingsMenu.classList.add("genlite-chat-container");

        // search bar
        this.searchRow = <HTMLElement>document.createElement("div");
        this.searchRow.classList.add("genlite-chat-search-row");
        this.settingsMenu.appendChild(this.searchRow);

        let search = <HTMLInputElement>document.createElement("input");
        this.searchRow.appendChild(search);
        search.classList.add("genlite-chat-search");
        search.placeholder = "Search Chats...";
        search.type = "text";

        search.onfocus = () => {
            document.game.CHAT.focus_locked = true;
        }

        search.onblur = () => {
            document.game.CHAT.focus_locked = false;
        }

        search.oninput = function (e) {
            let value = search.value.trim().toLowerCase();
            // TODO
        }

        this.listContainer = <HTMLElement>document.createElement("div");
        this.listContainer.classList.add("genlite-chats-list");
        this.settingsMenu.appendChild(this.listContainer);
        this.uiTab = document.genlite.ui.addTab("comments", "Chats", this.settingsMenu, this.isPluginEnabled);

        let publicChat = this.uiCreateChat("~public~", []);
        publicChat.classList.add("genlite-chat-row-public");
    }

    uiCreateChat(name: string, messages: Array<PrivateMessage>) {
        let container = <HTMLElement>document.createElement("div");
        container.classList.add("genlite-chat-row");
        this.listContainer.appendChild(container);
        this.chatRows[name] = container;

        let plugin = this;
        container.onclick = function (e) {
            plugin.uiOpenChat(name);
        }

        let profile = <HTMLElement>document.createElement("div");
        profile.classList.add("genlite-chat-profile");
        container.appendChild(profile);

        let profileBg = <HTMLElement>document.createElement("div");
        profileBg.classList.add("genlite-chat-profile-bg");
        profileBg.style.backgroundImage = "url(" + document.game.getStaticPath("/img/new_ux/player_hud/player_picture_empty.png") + ")";
        profile.appendChild(profileBg);

        let profilePic = <HTMLImageElement>document.createElement("img");
        profilePic.classList.add("genlite-chat-profile-pic");
        profile.appendChild(profilePic);

        this.uiUpdateProfilePic(name, profilePic);

        let badge = <HTMLElement>document.createElement("div");
        badge.classList.add("genlite-chat-badge");
        profile.appendChild(badge);

        let nameDiv = <HTMLElement>document.createElement("div");
        nameDiv.classList.add("genlite-chat-name");
        nameDiv.innerText = name;
        container.appendChild(nameDiv);

        let chatui = <HTMLElement>document.createElement("div");
        chatui.classList.add("genlite-chat-interface");
        this.settingsMenu.appendChild(chatui);
        (chatui as any).profilePic = profilePic;
        this.chatUIs[name] = chatui;

        let title = <HTMLElement>document.createElement("div");
        title.classList.add("genlite-chat-title");
        title.innerText = name;
        chatui.appendChild(title);

        let back = <HTMLElement>document.createElement("div");
        back.classList.add("genlite-chat-back");
        back.onclick = function () {
            plugin.uiCloseChat();
        }
        back.innerHTML = '<i class="fas fa-arrow-left"></i>';
        title.appendChild(back);

        let messagesList = <HTMLElement>document.createElement("div");
        messagesList.classList.add("genlite-chat-messages-list");
        chatui.appendChild(messagesList);

        for (const m of messages.reverse()) {
            let mdiv = <HTMLElement>document.createElement("div");
            mdiv.classList.add("genlite-chat-message");
            if (m.sent) {
                mdiv.classList.add("genlite-chat-message-sent");
            }
            mdiv.innerText = m.text;
            messagesList.appendChild(mdiv);
        }

        let input = <HTMLInputElement>document.createElement("input");
        input.classList.add("genlite-chat-input");
        chatui.appendChild(input);
        input.onfocus = () => {
            document.game.CHAT.focus_locked = true;
        }
        input.onblur = () => {
            document.game.CHAT.focus_locked = false;
        }
        // TODO: this is currently display:none until we figure out:
        //       - fetch username (not display name)
        //       - send message w/o network.action
        input.onkeyup = (e) => {
            if (e.key === "Enter") {
                console.log("Sending to " + name, input.value);
                input.value = '';
            }
        }
        return container;
    }

    uiOpenChat(name: string) {
        if (this.openChat) {
            this.uiCloseChat();
        }

        let ui = this.chatUIs[name];
        ui.style.display = 'flex';
        this.markAsRead(name);

        this.openChat = name;
        this.searchRow.style.display = 'none';
        this.listContainer.style.display = 'none';
    }

    uiCloseChat() {
        this.searchRow.style.removeProperty('display');
        this.listContainer.style.removeProperty('display');
        this.chatUIs[this.openChat].style.removeProperty('display');
        this.openChat = null;;
    }

    uiAddMessage(name: string, text: string, sent: boolean) {
        let ui = this.chatUIs[name];
        if (ui) {
            let elements = ui.getElementsByClassName("genlite-chat-messages-list");
            let messagesList = elements[0] as HTMLElement;
            let mdiv = <HTMLElement>document.createElement("div");
            mdiv.classList.add("genlite-chat-message");
            if (sent) {
                mdiv.classList.add("genlite-chat-message-sent");
            }
            mdiv.innerText = text;
            messagesList.prepend(mdiv);

            if (!(ui as any).profilePic.src) {
                this.uiUpdateProfilePic(name, (ui as any).profilePic);
            }
        } else {
            this.uiCreateChat(name, [{ text, sent }]);
        }

        if (!sent && name != this.openChat) {
            let row = this.chatRows[name];
            row.classList.add("genlite-chat-row-unread");
            this.uiDisplayNotificationBadge(true);
            // move unread messages to top (but below public)
            row.remove();
            this.listContainer.children[0].insertAdjacentElement("afterend", row);
        }
    }

    uiTrimAndAddMessage(speaker, text) {
        const frHeader = "(PM from ";
        const toHeader = "(PM to ";
        if (speaker.includes(frHeader)) {
            let name = speaker.substring(frHeader.length, speaker.length - 1);
            this.uiAddMessage(name, text, false);
        } else if (speaker.includes(toHeader)) {
            let name = speaker.substring(toHeader.length, speaker.length - 1);
            this.uiAddMessage(name, text, true);
        }
    }

    uiAddPublicMessage(speaker, text) {
        let ui = this.chatUIs["~public~"];
        if (!ui) return;

        let elements = ui.getElementsByClassName("genlite-chat-messages-list");
        let messagesList = elements[0] as HTMLElement;
        let mdiv = <HTMLElement>document.createElement("div");
        mdiv.classList.add("genlite-chat-message");
        mdiv.innerText = text;

        let nick = document.game.PLAYER.character.nickname;
        if (nick === speaker) {
            this.lastPublicSpeaker = null;
            mdiv.classList.add("genlite-chat-message-sent");
        } else if (speaker != this.lastPublicSpeaker) {
            let speakerDiv = <HTMLElement>document.createElement("div");
            speakerDiv.classList.add("genlite-chat-message-author");
            speakerDiv.innerText = speaker;
            messagesList.prepend(speakerDiv);
            this.lastPublicSpeaker = speaker;
        }

        messagesList.prepend(mdiv);

        if (!this.markPublicRead && nick !== speaker && this.openChat !== "~public~") {
            this.chatRows["~public~"].classList.add("genlite-chat-row-unread");
            this.uiDisplayNotificationBadge(true);
        }
    }

    uiDisplayNotificationBadge(display: boolean) {
        let tab = document.getElementById('genlite-ui-tab-comments');
        if (!tab) return;

        let icon = tab.children[0] as HTMLElement;
        if (display) {
            icon.style.color = "aqua";
        } else {
            icon.style.removeProperty("color");
        }
    }

    uiDisplayPlayerOnline(name: string) {
        let row = this.chatRows[name];
        if (row) {
            let eles = row.getElementsByClassName('genlite-chat-badge');
            if (eles) {
                let badge = eles[0] as HTMLElement;
                if (badge) badge.style.visibility = 'visible';
            }
        }
    }

    uiDisplayPlayerOffline(name: string) {
        let row = this.chatRows[name];
        if (row) {
            let eles = row.getElementsByClassName('genlite-chat-badge');
            if (eles) {
                let badge = eles[0] as HTMLElement;
                if (badge) badge.style.removeProperty('visibility');
            }
        }
    }

    // checks cache before fetching new
    uiUpdateProfilePic(name: string, image: HTMLImageElement) {
        if (image === null) {
            let ui = this.chatUIs[name];
            if (!ui) return;
            image = (ui as any).profilePic;
        }

        if (!this.cacheProfilePics) {
            this.uiFetchNewProfilePic(name, image);
            return;
        }

        let plugin = this;
        document.genlite.database.storeTx(
            'profiles',
            'readonly',
            (store) => {
                let request = store.get(name);
                request.onsuccess = (e) => {
                    let record = request.result;
                    if (record && record.image) {
                        image.src = record.image;
                    } else {
                        plugin.uiFetchNewProfilePic(name, image);
                    }
                };
            }
        );
    }

    uiFetchNewProfilePic(name: string, image: HTMLImageElement) {
        if (image === null) {
            let ui = this.chatUIs[name];
            if (!ui) {
                this.uiCreateChat(name, []);
                ui = this.chatUIs[name];
            }
            if (ui) {
                image = (ui as any).profilePic;
            }
        }

        let camera = document['GenLiteCameraPlugin'];
        if (camera) {
            let plugin = this;
            camera.getPlayerPicture(name, (data) => {
                if (image) {
                    image.src = data;
                }
                if (plugin.cacheProfilePics) {
                    document.genlite.database.storeTx(
                        'profiles',
                        'readwrite',
                        (store) => {
                            store.put({
                                name: name,
                                image: data,
                            });
                        }
                    );
                }
            });
        }
    }

    markAllAsRead() {
        for (let name in this.chatRows) {
            this.chatRows[name].classList.remove('genlite-chat-row-unread');
        }
        this.uiDisplayNotificationBadge(false);
    }

    markAsRead(name: string) {
        this.chatRows[name].classList.remove('genlite-chat-row-unread');
        for (const oname in this.chatRows) {
            let ui = this.chatRows[oname];
            if (ui.classList.contains('genlite-chat-row-unread')) {
                return;
            }
        }
        // all are read
        this.uiDisplayNotificationBadge(false);
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        this.updateState();
        if (this.uiTab) {
            this.uiTab.style.display = state ? "flex" : "none";
        }
    }

    public loginOK() {
        this.updateState();
    }

    refillChatBox() {
        let delta = this.preserveMinutes * 60 * 1000; // min to ms
        this.getRecentMessages(delta, (ms) => {

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
            plugin.markAllAsRead();
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

    handleCacheProfilePics(state: boolean) {
        this.cacheProfilePics = state;
    }

    handlePreserveMinutes(minutes: number) {
        this.preserveMinutes = minutes;
    }

    handleMarkPublicRead(state: boolean) {
        this.markPublicRead = state;
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
            document.game.CHAT.addPrivateMessage = function (e, speaker, n, i, a, r) {
                let dom = plugin.originalAddPrivateMessage.bind(this)(e, speaker, n, i, a, r);
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
            this.markAsRead(sentTo);
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
        var c: string[] = JSON.parse(s);
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

/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

interface IDBMessage {
    channel: string;
    timestamp: number;
    speaker: string;
    text: string;
}

interface Message {
    message: HTMLElement;
    timestamp: string;
}

interface MessageBuffer {
    messages: Message[];

    add(message: HTMLElement, timestamp: string): void;
    nth(offset: number): Message;
    clear(): void;
}

interface IFilterButton {
    button: HTMLElement;
    buffer: MessageBuffer;
    class?: string;
    visible?: boolean;
}

interface Chat {
    DOM_input: HTMLElement;
    DOM_input_cover: HTMLElement;
    DOM_chat_buffer: HTMLElement;

    filter_buttons: Record<string, IFilterButton>;
    system_buffer: MessageBuffer;
    focusOutHandler: Function;
    focus_locked: boolean;
    scroll_locked: boolean;
    show_timestamps: boolean;
    chat_buffer: HTMLElement[];

    processInput(): void;

    addGameMessage(text: string): void;
    addPrivateMessage(
        timestamp: number,
        speaker: string,
        text: string,
        icon: boolean,
        loopback: boolean,
        name: string
    ): void;
    addPublicMessage(
        timestamp: number,
        speaker: string,
        text: string,
        icon: boolean
    ): void;
    addQuestMessage(
        timestamp: number,
        speaker: string,
        icon: boolean
    ): void;
    addSystemBroadcastMessage(
        timestamp: number,
        text: string
    ): void;
    addMessage(
        type: string,
        timestamp: number,
        speaker: string,
        text: string,
        icon: boolean
    ): void;

    prototype: any;
}
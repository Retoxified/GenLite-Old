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

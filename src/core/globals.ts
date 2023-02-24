/** Browser globals */
declare interface Window {
    [key: string]: any,
}

declare interface CommandSpec {
    command: string,
    handler: (a: string) => void,
    helpFunction: (a: string) => string,
    helpText: string,
    echo: boolean,
}

declare const ITEM_RIGHTCLICK_LIMIT: number;

/** Library globals */
declare const THREE: {
    items: any,
    [key: string]: any,
};

/** GenFanad specific globals */
declare const GAME: {
    items: Record<string, typeof ItemStack>,
    [key: string]: any,
};

declare const Game: {
    [key: string]: any,
};

declare const DATA: {
    items: any,
    [key: string]: any,
};

declare const INVENTORY: {
    items: any,
    [key: string]: any,
};

declare const BANK: Bank;

declare const PLAYER: {
    items: any,
    [key: string]: any,
};

declare const PLAYER_INFO: {
    items: any,
    [key: string]: any,
};

declare const WorldManager: {
    [key: string]: any,
};

declare const ItemStack: {
    [key: string]: any,
};

declare const WORLDMANAGER: {
    [key: string]: any,
};

declare const MUSIC_PLAYER: {
    [key: string]: any,
};

declare const MUSIC_TRACK_NAMES: {
    [key: string]: string,
};

declare const GRAPHICS: {
    [key: string]: any,
};

declare const SETTINGS: any;

declare const PhasedLoadingManager: {
    [key: string]: any,
};

declare const Network: {
    [key: string]: any,
};

declare const Camera: {
    [key: string]: any,
};

declare const PlayerInfo: {
    [key: string]: any,
};

declare const CHAT: {
    [key: string]: any,
};

declare const NETWORK: {
    [key: string]: any,
};

declare const Chat: {
    [key: string]: any,
};

declare const NPC: {
    [key: string]: any,
}

declare const PlayerHUD: {
    [key: string]: any,
}

declare const SFX_PLAYER: {
    [key: string]: any,
}

declare const OptimizedScene: {
    [key: string]: any,
}

declare const KEYBOARD: {
    [key: string]: any,
}

declare class SFXPlayer {
}

declare const Inventory: {
    [key: string]: any,
};

/*
    Copyright (C) 2022-2023 Retoxified, FrozenReality, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

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

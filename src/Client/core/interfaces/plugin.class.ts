/*
    Copyright (C) 2023 FrozenReality dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

export abstract class GenLitePlugin {
    abstract init(): Promise<void>;
    abstract handlePluginState(state: boolean): void;
    postInit?(): Promise<void>;
    loginOK?(): void;
    initializeUI?(): void;
    Network_logoutOK?(): void;
    Network_action?(verb: string, params: object): void; // TODO: provide proper type
    Network_handle?(verb: string, payload: object): void;
    Camera_update?(dt: number): void;
    PlayerInfo_updateXP?(xp: object): void; // TODO: provide proper type
    PlayerInfo_updateTooltip?(): void;
    PlayerInfo_updateSkills?(): void;
    Game_combatUpdate?(update: any): void;
    PlayerHUD_setHealth?(current: number, max: number): void;
    Inventory_handleUpdatePacket?(packet: any): void;
    Bank_handlePacket?(packet: any): void;
    Bank__showQualityPopup?(packet: any): void;
    Bank__addContextOptionsActual?(item: object, contextMenu: contextMenu[], n: any): void;
    Bank__addContextOptions?(itemSlot: number, contextMenu: contextMenu[]): void;
    Trade_handlePacket?(packet: any): void;
    NPC_intersects?(ray: any, list: any): void;
    OptimizedScene_intersects?(ray: any, list: any): void;
    Inventory__getAllContextOptions?(itemID, itemActions): void;
    Inventory__getContextOptionsBank?(slotId: number, invBankObject: invBankObject, contextMenu: contextMenu[]): void;
    WORLDMANAGER_loadSegment?(segmentData: SegmentKey, segmentKey: string, onComplete: () => void): void;
    WORLDMANAGER_createSegment?(segmentData: SegmentKey, segmentObjects: object): void;
    Segment_load?(segmentObjects: object, thisSegment: Segment): void;

    log(...args): void {
        if (process.env.NODE_ENV === 'production')
            return;
        console.log(`[${this.constructor.name}]`, args);
    }

    info(...args): void {
        if (process.env.NODE_ENV === 'production')
            return;
        console.info(`[${this.constructor.name}]`, args);
    }

    warn(...args): void {
        console.warn(`[${this.constructor.name}]`, args);
    }

    error(...args): void {
        console.error(`[${this.constructor.name}]`, args);
    }
}

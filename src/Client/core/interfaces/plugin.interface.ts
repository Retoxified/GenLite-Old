/*
    Copyright (C) 2023 FrozenReality
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

export interface GenLitePlugin {
    init: () => Promise<void>,
    handlePluginState(state: boolean): void,
    postInit?: () => Promise<void>,
    loginOK?: () => void,
    logoutOK?: () => void,
    action?: (verb: string, params: any) => void // TODO: provide proper type
    handle?: (verb: string, payload: any) => void,
    update?: (dt: number) => void,
    updateXP?: (xp: any) => void, // TODO: provide proper type
    updateTooltip?: () => void,
    updateSkills?: () => void,
    initializeUI?: () => void,
    combatUpdate?: (update: any) => void,
    setHealth?: (current: number, max: number) => void,
    handleUpdatePacket?: (packet: any) => void,
    handlePacket?: (packet: any) => void,
    _showQualityPopup?: (packet: any) => void,
    Trade_handlePacket?: (packet: any) => void,
    _addContextOptionsActual?: (item: any, contextMenu: any, n: any) => void,
    _addContextOptions?: (itemSlot: Number, contextMenu: any) => void,
    NPC_Intersects?: (ray: any, list: any) => void,
    OptimizedScene_Intersects?: (ray: any, list: any) => void,
    Inventory_Intersects?: (e: any, t: any) => void,
}

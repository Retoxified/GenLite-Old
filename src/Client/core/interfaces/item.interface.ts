/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.
    
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

interface ILocation {
    position: {
        x: number;
        y: number;
    }
}

interface IItemInfo {
    ids: { [id: string]: boolean };
    value: number;
    name: string;
    text(): string;
    examine: string;
}

interface ISprite {
    sprite: any; // THREE.Sprite;
    ids: { [id: string]: boolean };
}

interface IItemKeys {
    [id: string]: {
        image: string;
        item_id: string;
    }
}

interface IAction {
    color: string;
    distance: number;
    priority: number;
    object: IItemInfo;
    text: string;
    action: () => void;
}

interface IItemStack {
    id: string;
    location: ILocation;
    dirty: boolean;
    item_keys: IItemKeys;
    sprites: { [image: string]: ISprite };
    item_info: { [item_id: string]: IItemInfo };
    optimizationX: number;
    optimizationY: number;
    ignore_intersections: boolean;
    mesh: any; // THREE.Group;
    worldPos: { x: number; y: number; z: number };
    position(): { x: number; y: number; z: number };
    text(): string;
    actions(): IAction[];
    addInstance(id: string, def: { item: string }): void;
    removeInstance(id: string): boolean;
    intersects(ray: any /*THREE.Raycaster*/, list: IAction[]): void;
    update(cam: any /*THREE.Camera*/, dt: number): void;

    prototype: any;
}
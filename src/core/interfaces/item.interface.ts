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

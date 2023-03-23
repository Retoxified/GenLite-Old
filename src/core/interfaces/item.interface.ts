interface Location {
  position: {
    x: number;
    y: number;
  }
}

interface ItemInfo {
  ids: { [id: string]: boolean };
  value: number;
  name: string;
  text(): string;
  examine: string;
}

interface Sprite {
  sprite: any; // THREE.Sprite;
  ids: { [id: string]: boolean };
}

interface ItemKeys {
  [id: string]: {
    image: string;
    item_id: string;
  }
}

interface Action {
  color: string;
  distance: number;
  priority: number;
  object: ItemInfo;
  text: string;
  action: () => void;
}

interface ItemStack {
  id: string;
  location: Location;
  dirty: boolean;
  item_keys: ItemKeys;
  sprites: { [image: string]: Sprite };
  item_info: { [item_id: string]: ItemInfo };
  optimizationX: number;
  optimizationY: number;
  ignore_intersections: boolean;
  mesh: any; // THREE.Group;
  worldPos: { x: number; y: number; z: number };
  position(): { x: number; y: number; z: number };
  text(): string;
  actions(): Action[];
  addInstance(id: string, def: { item: string }): void;
  removeInstance(id: string): boolean;
  intersects(ray: any /*THREE.Raycaster*/, list: Action[]): void;
  update(cam: any /*THREE.Camera*/, dt: number): void;
}

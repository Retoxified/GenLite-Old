interface WorldManager {

    active: boolean,
    currentLayer?: string,
    dirty: boolean,
    indoors: boolean,

    loadedSegments: {[Key: string]: Segment},
    nonexistentSegments: object, //TODO
    pvp_zone: boolean,
    segment: SegmentMapInfo,
    segmentKey: string,
    x: number,
    y: number
}

interface Segment {
    active: boolean,
    animations: object,
    bb: SegmentBounds,
    data: object, //TODO
    effect_instances: any[], //TODO
    effects: object, //TODO
    layer: string,
    minimap: HTMLCanvasElement,
    objectReferances: object, //TODO
    objects: object, //TODO
    position: SegmentKey,
    preload_finished: boolean,
    terrainMesh: object, //TODO
}

interface SegmentBounds {
    isBox3: Boolean,
    max: Vector3,
    min: Vector3
}

interface Vector3 {
    x: number,
    y: number,
    z: number
}

interface SegmentKey {
    layer: string,
    mx: number,
    my: number
}

interface SegmentMapInfo {
    layer: string,
    lx: number,
    ly: number,
    mx: number,
    my: number,
    x: number,
    y: number
}
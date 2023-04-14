/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/
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
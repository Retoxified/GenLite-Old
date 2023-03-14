/*
    Copyright (C) 2022-2023 Retoxified, dpeGit, snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import {
    SkyboxUriLeft,
    SkyboxUriRight,
    SkyboxUriUp,
    SkyboxUriDown,
    SkyboxUriBack,
    SkyboxUriFront,
} from "./skybox-data";
import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteCameraPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteCameraPlugin';

    static minRenderDistance = 40;
    static maxRenderDistance = 150;
    static defaultRenderDistance = 65;

    static minFogLevel = 0.0;
    static maxFogLevel = 1.0;
    static defaultFogLevel = 0.5;

    originalCameraMode: Function;

    unlockCamera: boolean = true;
    hideRoofs: boolean = false;
    maxDistance: Number = 15;
    minDistance: Number = Math.PI;

    renderDistance: number = 65;
    distanceFog: boolean = false;
    fogLevel: number = 0.5;
    skyboxEnabled: boolean = false;
    skybox: any = null;

    async init() {
        document.genlite.registerPlugin(this);

        this.originalCameraMode = document.game.WorldManager.updatePlayerTile;

        this.unlockCamera = document.genlite.settings.add("Camera.UnlockCam", true, "Unlock Camera", "checkbox", this.handleUnlockCameraToggle, this);
        this.hideRoofs = document.genlite.settings.add("Camera.HideRoofs", true, "Hide Roofs", "checkbox", this.handleHideRoofToggle, this);
        this.maxDistance = parseInt(document.genlite.settings.add(
            "Camera.maxDistance",
            "15",
            "Max Distance: <div style=\"display: contents;\" id=\"GenLiteMaxDistanceOutput\"></div>",
            "range",
            this.handleMaxDistance,
            this,
            undefined,
            [
                ["min", "8"],
                ["max", "32"],
                ["step", "1"],
                ["value", "15"],
                ["class", "gen-slider"]
            ], "Camera.UnlockCam"
        ));
        document.getElementById("GenLiteMaxDistanceOutput").innerHTML = this.maxDistance.toString();
        this.minDistance = parseInt(document.genlite.settings.add(
            "Camera.minDistance",
            "3.14",
            "Min Distance: <div style=\"display: contents;\" id=\"GenLiteMinDistanceOutput\"></div>",
            "range",
            this.handleMinDistance,
            this,
            undefined,
            [
                ["min", "0"],
                ["max", "8"],
                ["step", "1"],
                ["value", "3.14"],
                ["class", "gen-slider"]
            ], "Camera.UnlockCam"
        ));
        document.getElementById("GenLiteMinDistanceOutput").innerHTML = this.minDistance.toString();
        this.skyboxEnabled = document.genlite.settings.add("Camera.Skybox", true, "Skybox", "checkbox", this.handleSkybox, this);
        this.distanceFog = document.genlite.settings.add("Camera.Fog", true, "Fog", "checkbox", this.handleFog, this);
        this.fogLevel = parseFloat(document.genlite.settings.add(
            "Camera.FogLevel",
            GenLiteCameraPlugin.defaultFogLevel.toString(),
            "Fog Level",
            "range",
            function (v) {
                this.handleFogLevel(parseFloat(v));
            },
            this,
            undefined,
            [
                ["min", GenLiteCameraPlugin.minFogLevel.toString()],
                ["max", GenLiteCameraPlugin.maxFogLevel.toString()],
                ["value", GenLiteCameraPlugin.defaultFogLevel.toString()],
                ["class", "gen-slider"],
                ["step", "0.05"],
            ],
            this.distanceFog
        ));
        this.renderDistance = parseFloat(document.genlite.settings.add(
            "Camera.RenderDistance",
            GenLiteCameraPlugin.defaultRenderDistance.toString(),
            "Render Distance",
            "range",
            function (v) {
                this.handleRenderDistance(parseFloat(v));
            },
            this,
            undefined,
            [
                ["min", GenLiteCameraPlugin.minRenderDistance.toString()],
                ["max", GenLiteCameraPlugin.maxRenderDistance.toString()],
                ["value", GenLiteCameraPlugin.defaultRenderDistance.toString()],
                ["class", "gen-slider"],
                ["step", "5"],
            ]
        ));
    }

    handleUnlockCameraToggle(state: boolean) {
        this.unlockCamera = state;
        this.setCameraMode();
    }
    handleHideRoofToggle(state: boolean) {
        this.hideRoofs = state;
        this.setCameraMode();
    }

    handleMaxDistance(value: Number) {
        this.maxDistance = value;
        document.getElementById("GenLiteMaxDistanceOutput").innerHTML = value.toString();
        this.setCameraMode();
    }

    handleMinDistance(value: Number) {
        this.minDistance = value;
        document.getElementById("GenLiteMinDistanceOutput").innerHTML = value.toString();
        this.setCameraMode();
    }

    handleRenderDistance(value: number) {
        this.renderDistance = value;
        document.game.GRAPHICS.camera.camera.far = value;
        document.game.GRAPHICS.camera.camera.updateProjectionMatrix();

        // genfanad does a bit of it's own object pruning, so we update that
        // distance as well Then we need to iterate over every object and
        // render the newly visible ones, because by default this would only
        // occur when the player moves.
        document.game.GRAPHICS.scene.dd2 = value * value;
        for (let i in document.game.GRAPHICS.scene.allObjects) {
            let o = document.game.GRAPHICS.scene.allObjects[i];
            if (document.game.GRAPHICS.scene.checkObject(o)) {
                document.game.GRAPHICS.scene.showObject(i);
            }
        }

        this.handleFog(this.distanceFog); // update fog distance
    }

    handleSkybox(value: boolean) {
        this.skyboxEnabled = value;
        if (value) {
            if (this.skybox == null) {
                const loader = new document.game.THREE.CubeTextureLoader();
                this.skybox = loader.load([
                    SkyboxUriLeft,
                    SkyboxUriRight,
                    SkyboxUriUp,
                    SkyboxUriDown,
                    SkyboxUriBack,
                    SkyboxUriFront,
                ]);
            }
            document.game.GRAPHICS.scene.threeScene.background = this.skybox;
        } else {
            document.game.GRAPHICS.scene.threeScene.background = null;
            this.skybox = null;
        }

        this.handleFog(this.distanceFog); // update fog color
    }

    handleFog(value: boolean) {
        this.distanceFog = value;
        this.updateFog();
    }

    handleFogLevel(value: number) {
        this.fogLevel = value;
        this.updateFog();
    }

    updateFog() {
        if (this.distanceFog) {
            let color = 0x000000;
            if (this.skyboxEnabled) {
                color = 0xDEFDFF;
            }
            let far = this.renderDistance;
            let near = -1.0 + (far - (far * this.fogLevel));
            document.game.GRAPHICS.scene.threeScene.fog = new document.game.THREE.Fog(color, near, far);
        } else {
            document.game.GRAPHICS.scene.threeScene.fog = null;
        }
    }

    loginOK() {
        this.setCameraMode();
        this.handleRenderDistance(this.renderDistance);
        this.handleSkybox(this.skyboxEnabled);
    }

    setCameraMode() {
        if (document.game.WORLDMANAGER !== undefined) {
            if (this.hideRoofs === true) {
                document.game.WORLDMANAGER.updatePlayerTile = this.noRoofCameraMode.bind(document.game.WORLDMANAGER);
            } else {
                document.game.WORLDMANAGER.updatePlayerTile = this.originalCameraMode.bind(document.game.WORLDMANAGER);
            }
            document.game.WORLDMANAGER.updatePlayerTile.call(document.game.WORLDMANAGER);
        }

        if (document.game.GRAPHICS !== undefined) {
            if (this.unlockCamera === true) {
                document.game.GRAPHICS.camera.controls.minDistance = this.minDistance;
                document.game.GRAPHICS.camera.controls.maxDistance = this.maxDistance;
                document.game.GRAPHICS.camera.controls.minPolarAngle = 0.35;
                document.game.GRAPHICS.camera.controls.maxPolarAngle = 1.4;
            } else {
                document.game.GRAPHICS.camera.controls.minDistance = 8
                document.game.GRAPHICS.camera.controls.maxDistance = 8;
                document.game.GRAPHICS.camera.controls.minPolarAngle = document.game.THREE.Math.degToRad(45);
                document.game.GRAPHICS.camera.controls.maxPolarAngle = document.game.THREE.Math.degToRad(57);
            }
        }
    }
    noRoofCameraMode() {
        const self = (this as any);

        let tile = self.loadedSegments[self.segmentKey].getTile(self.segment.lx, self.segment.ly)
        if (!tile)
            throw `Invalid location: ${self.segmentKey} ${self.segment.lx}, ${self.segment.ly}`
        self.indoors = true;
        for (let i in self.loadedSegments) {
            self.loadedSegments[i].setIndoorStatus(self.indoors);
        }
        if (tile.pvp) {
            let pvp = document.getElementById('pvp_indicator');
            pvp.style.display = 'block';
            pvp.innerText = "PvP Level: YES";
            self.pvp_zone = true;
        } else {
            document.getElementById('pvp_indicator').style.display = 'none';
            self.pvp_zone = false;
        }
        document.game.MUSIC_PLAYER.setNextTrack(tile.music);
    }
}

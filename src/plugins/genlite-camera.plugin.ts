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

    unlockCamera: boolean = false;
    hideRoofs: boolean = false;
    maxDistance: Number = 15;
    minDistance: Number = Math.PI;

    renderDistance: number = 65;
    distanceFog: boolean = true;
    fogLevel: number = 0.5;
    skyboxEnabled: boolean = true;
    skybox: any = null;

    async init() {
        window.genlite.registerPlugin(this);

        this.originalCameraMode = WorldManager.prototype.updatePlayerTile;

        this.unlockCamera = window.genlite.settings.add("Camera.UnlockCam", true, "Unlock Camera", "checkbox", this.handleUnlockCameraToggle, this);
        this.hideRoofs = window.genlite.settings.add("Camera.HideRoofs", true, "Hide Roofs", "checkbox", this.handleHideRoofToggle, this);
        this.maxDistance = parseInt(window.genlite.settings.add(
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
        this.minDistance = parseInt(window.genlite.settings.add(
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
        this.skyboxEnabled = window.genlite.settings.add("Camera.Skybox", true, "Skybox", "checkbox", this.handleSkybox, this);
        this.distanceFog = window.genlite.settings.add("Camera.Fog", true, "Fog", "checkbox", this.handleFog, this);
        this.fogLevel = parseFloat(window.genlite.settings.add(
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
        this.renderDistance = parseFloat(window.genlite.settings.add(
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
        GRAPHICS.camera.camera.far = value;
        GRAPHICS.camera.camera.updateProjectionMatrix();

        // genfanad does a bit of it's own object pruning, so we update that
        // distance as well Then we need to iterate over every object and
        // render the newly visible ones, because by default this would only
        // occur when the player moves.
        GRAPHICS.scene.dd2 = value * value;
        for (let i in GRAPHICS.scene.allObjects) {
            let o = GRAPHICS.scene.allObjects[i];
            if (GRAPHICS.scene.checkObject(o)) {
                GRAPHICS.scene.showObject(i);
            }
        }

        this.handleFog(this.distanceFog); // update fog distance
    }

    handleSkybox(value: boolean) {
        this.skyboxEnabled = value;
        if (value) {
            if (this.skybox == null) {
                const loader = new THREE.CubeTextureLoader();
                this.skybox = loader.load([
                    SkyboxUriLeft,
                    SkyboxUriRight,
                    SkyboxUriUp,
                    SkyboxUriDown,
                    SkyboxUriBack,
                    SkyboxUriFront,
                ]);
            }
            GRAPHICS.scene.threeScene.background = this.skybox;
        } else {
            GRAPHICS.scene.threeScene.background = null;
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
            GRAPHICS.scene.threeScene.fog = new THREE.Fog(color, near, far);
        } else {
            GRAPHICS.scene.threeScene.fog = null;
        }
    }

    loginOK() {
        this.setCameraMode();
        this.handleRenderDistance(this.renderDistance);
        this.handleSkybox(this.skyboxEnabled);
    }

    setCameraMode() {
        if (WORLDMANAGER !== undefined) {
            if (this.hideRoofs === true) {
                WORLDMANAGER.updatePlayerTile = this.noRoofCameraMode.bind(WORLDMANAGER);
            } else {
                WORLDMANAGER.updatePlayerTile = this.originalCameraMode.bind(WORLDMANAGER);
            }
            WORLDMANAGER.updatePlayerTile.call(WORLDMANAGER);
        }

        if (GRAPHICS !== undefined) {
            if (this.unlockCamera === true) {
                GRAPHICS.camera.controls.minDistance = this.minDistance;
                GRAPHICS.camera.controls.maxDistance = this.maxDistance;
                GRAPHICS.camera.controls.minPolarAngle = 0.35;
                GRAPHICS.camera.controls.maxPolarAngle = 1.4;
            } else {
                GRAPHICS.camera.controls.minDistance = 8
                GRAPHICS.camera.controls.maxDistance = 8;
                GRAPHICS.camera.controls.minPolarAngle = THREE.Math.degToRad(45);
                GRAPHICS.camera.controls.maxPolarAngle = THREE.Math.degToRad(57);
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
        MUSIC_PLAYER.setNextTrack(tile.music);
    }
}

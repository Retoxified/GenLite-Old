import {
    SkyboxUriLeft,
    SkyboxUriRight,
    SkyboxUriUp,
    SkyboxUriDown,
    SkyboxUriBack,
    SkyboxUriFront,
} from "./skybox-data";


export class GenLiteCameraPlugin {
    static pluginName = 'GenLiteCameraPlugin';

    static minRenderDistance = 40;
    static maxRenderDistance = 150;
    static defaultRenderDistance = 65;

    originalCameraMode: Function;

    unlockCamera: boolean = false;
    hideRoofs: boolean = false;

    renderDistance: number = 65;
    distanceFog: boolean = true;
    skyboxEnabled: boolean = true;
    skybox: any = null;

    async init() {
        window.genlite.registerModule(this);

        this.originalCameraMode = WorldManager.prototype.updatePlayerTile;

        this.unlockCamera = window.genlite.settings.add("Camera.UnlockCam", true, "Unlock Camera", "checkbox", this.handleUnlockCameraToggle, this);
        this.hideRoofs = window.genlite.settings.add("Camera.HideRoofs", true, "Hide Roofs", "checkbox", this.handleHideRoofToggle, this);
        this.skyboxEnabled = window.genlite.settings.add("Camera.Skybox", true, "Skybox", "checkbox", this.handleSkybox, this);
        this.distanceFog = window.genlite.settings.add("Camera.Fog", true, "Fog", "checkbox", this.handleFog, this);
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
        if (value) {
            let color = 0x000000;
            if (this.skyboxEnabled) {
                color = 0xDEFDFF;
            }
            // density ranges from 0.01 to 0.0125 based on render distance
            let delta = this.renderDistance - GenLiteCameraPlugin.minRenderDistance;
            let maxDelta = GenLiteCameraPlugin.maxRenderDistance - GenLiteCameraPlugin.minRenderDistance;
            let density = 0.01 + 0.0025 * (delta / maxDelta);
            GRAPHICS.scene.threeScene.fog = new THREE.FogExp2(color, density);
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
                GRAPHICS.camera.controls.maxDistance = 15;
                GRAPHICS.camera.controls.minPolarAngle = 0.35;
                GRAPHICS.camera.controls.maxPolarAngle = 1.4;
            } else {
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

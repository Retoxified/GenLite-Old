export class GenLiteCameraPlugin {
    static pluginName = 'GenLiteCameraPlugin';

    originalCameraMode: Function;

    unlockCamera: boolean = false;
    hideRoofs: boolean = false;

    renderDistance: number = 65;

    async init() {
        window.genlite.registerModule(this);

        this.originalCameraMode = WorldManager.prototype.updatePlayerTile;

        this.unlockCamera = window.genlite.settings.add("Camera.UnlockCam", true, "Unlock Camera", "checkbox", this.handleUnlockCameraToggle, this);
        this.hideRoofs = window.genlite.settings.add("Camera.HideRoofs", true, "Hide Roofs", "checkbox", this.handleHideRoofToggle, this);
        this.renderDistance = parseFloat(window.genlite.settings.add(
            "Camera.RenderDistance",
            "65",
            "Render Distance",
            "range",
            function (v) {
                this.handleRenderDistance(parseFloat(v));
            },
            this,
            undefined,
            [
                ["min", "40"],
                ["max", "150"],
                ["step", "5"],
                ["value", "65"],
                ["class", "gen-slider"]
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
    }

    loginOK() {
        this.setCameraMode();
        this.handleRenderDistance(this.renderDistance);
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

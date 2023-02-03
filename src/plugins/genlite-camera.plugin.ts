export class GenLiteCameraPlugin {
    static pluginName = 'GenLiteCameraPlugin';

    originalCameraMode: Function;

    unlockCamera: boolean = false;
    hideRoofs: boolean = false;
    async init() {
        window.genlite.registerModule(this);

        this.originalCameraMode = WorldManager.prototype.updatePlayerTile;

        this.unlockCamera = window.genlite.settings.add("Camera.UnlockCam", true, "Unlock Camera", "checkbox", this.handleUnlockCameraToggle, this);
        this.hideRoofs = window.genlite.settings.add("Camera.HideRoofs", true, "Hide Roofs", "checkbox", this.handleHideRoofToggle, this);
    }


    handleUnlockCameraToggle(state: boolean) {
        this.unlockCamera = state;
        this.setCameraMode();
    }
    handleHideRoofToggle(state: boolean) {
        this.hideRoofs = state;
        this.setCameraMode();
    }

    loginOK() {
        this.setCameraMode();
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

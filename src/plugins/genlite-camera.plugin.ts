export class GenLiteCameraPlugin {
    static pluginName = 'GenLiteCameraPlugin';

    async init() {
        window.genlite.registerModule(this);
    }

    loginOK() {
        WorldManager.prototype.updatePlayerTile = this.updatePlayerTileAlwaysIndoor;

        for(let key in WORLDMANAGER.loadedSegments) {
            WORLDMANAGER.loadedSegments[key].setIndoorStatus(true);
        }

        GRAPHICS.camera.controls.maxDistance = 15;
        GRAPHICS.camera.controls.maxPolarAngle = 1.4;
        GRAPHICS.camera.controls.minPolarAngle = 0.35;
    }

    updatePlayerTileAlwaysIndoor() {
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

// ==UserScript==
// @name         GenLite Camera Unlock
// @namespace    GenLite
// @version      0.1
// @description  try to take over the world!
// @author       TwistedFate#4053
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==

(function() {
    class GenLiteCameraPlugin {
        init() {
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
            let tile = this.loadedSegments[this.segmentKey].getTile(this.segment.lx, this.segment.ly)
            if (!tile)
                throw `Invalid location: ${this.segmentKey} ${this.segment.lx}, ${this.segment.ly}`
                this.indoors = true;
            for (let i in this.loadedSegments) {
                this.loadedSegments[i].setIndoorStatus(this.indoors);
            }
            if (tile.pvp) {
                let pvp = document.getElementById('pvp_indicator');
                pvp.style.display = 'block';
                pvp.innerText = "PvP Level: YES";
                this.pvp_zone = true;
            } else {
                document.getElementById('pvp_indicator').style.display = 'none';
                this.pvp_zone = false;
            }
            MUSIC_PLAYER.setNextTrack(tile.music);
        }
    }

    window.genliteCamera = new GenLiteCameraPlugin();

    let gameLoadTimer = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
				window.genliteCamera.init();
                clearInterval(gameLoadTimer);
            }
        } catch (e) {
        }
    }, 1000);
})();
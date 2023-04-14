/*
    Copyright (C) 2022-2023 KKonaOG
*/
/*
    This file is part of GenLite.
   
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
   
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

// Import GenLite Plugin Interface
import {GenLitePlugin} from '../core/interfaces/plugin.class';

// Create PlayerTools Plugin Class
export class GenLitePlayerToolsPlugin extends GenLitePlugin {
    static pluginName = 'GenLitePlayerToolsPlugin';

    // Plugin Settings
    isEnabled: boolean = false; // Enable the plugin (Enabled/Disabled by the user)
    doRender: boolean = false; // Render the plugin's UI (Enabled by LoginOK(), disabled by LogoutOK())

    // Plugin Data
    trackedPlayers = {};

    // Plugin UI
    PlayerTagContainer: HTMLDivElement;
    
    pluginSettings : Settings = {
        // Checkbox Example
        "Hide Character": {
            type: 'checkbox',
            oldKey: 'GenLite.PlayerTools.HidePlayer',
            value: false,
            stateHandler: this.handleHidePlayerSettingChange.bind(this)
        }
    };
    

    // Plugin Hooks
    async init() {
        document.genlite.registerPlugin(this);

        // Create and Append the Player Tag Container to the Body
        this.PlayerTagContainer = document.createElement('div');
        this.PlayerTagContainer.className = 'player-tag-container';
        document.body.appendChild(this.PlayerTagContainer);
    }

    async postInit() {
        this.pluginSettings = document.genlite.ui.registerPlugin("Player Tools", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        if (!state) {
            // Clear Tracked Players
            this.trackedPlayers = {};

            // Empty the Player Tag Container
            this.PlayerTagContainer.innerHTML = "";
        }

        this.isEnabled = state;
    }

    Camera_update(dt) {
        // Set the Player Tag Container's Visibility to Hidden based off doRender
        this.PlayerTagContainer.style.visibility = this.doRender ? 'visible' : 'hidden';

        // Verify the plugin is enabled and the UI is in a renderable state before continuing
        if (!this.isEnabled || !this.doRender) return;

        // Get World Players
        const worldPlayers = document.game.GAME.players;

        // Determine Players to Add to Tracking
        let newPlayers = Object.keys(worldPlayers).filter(pID => !Object.keys(this.trackedPlayers).includes(pID));

        // Determine Players to Remove from Tracking
        let oldPlayers = Object.keys(this.trackedPlayers).filter(pID => !Object.keys(worldPlayers).includes(pID));

        // Add New Players to Tracking
        newPlayers.forEach(pID => {
            this.trackedPlayers[pID] = {
                character: worldPlayers[pID],
                tag: document.createElement('div')
            };


            // Set the Player Tag's HTML to the Player's Nickname
            this.trackedPlayers[pID].tag.innerHTML = this.trackedPlayers[pID].character.nickname;

            // Set the Player Tag's Attributes
            
            // Font Family
            this.trackedPlayers[pID].tag.style.fontFamily = 'acme, times new roman, Times, serif';

            // Absolute
            this.trackedPlayers[pID].tag.style.position = 'absolute';

            // Transform
            this.trackedPlayers[pID].tag.style.transform = 'translate(-50%)';

            // No Pointer Events
            this.trackedPlayers[pID].tag.style.pointerEvents = 'none';

            // Text Shadow
            this.trackedPlayers[pID].tag.style.textShadow = '-1px -1px 0 #000,0   -1px 0 #000, 1px -1px 0 #000, 1px  0   0 #000, 1px  1px 0 #000, 0    1px 0 #000, -1px  1px 0 #000, -1px  0   0 #000';

            // Font Size
            // this.trackedPlayers[pID].tag.style.fontSize = '20px';

            // Add the Player Tag to the Player Tag Container
            this.PlayerTagContainer.appendChild(this.trackedPlayers[pID].tag);
        });

        // Remove Old Players from Tracking
        oldPlayers.forEach(pID => {
            // These two checks are here for "failsafe" purposes. If the Player Tag is undefined, or if the Player Tag Container is empty, then remove the Player from Tracking.
            if (this.trackedPlayers[pID].tag === undefined) {
                delete this.trackedPlayers[pID];
                return;
            }

            if (this.PlayerTagContainer.innerHTML == "") {
                delete this.trackedPlayers[pID];
                return;
            }

            this.PlayerTagContainer.removeChild(this.trackedPlayers[pID].tag);
            delete this.trackedPlayers[pID];
        });


        // Update Player Tag Positions
        Object.keys(this.trackedPlayers).forEach(pID => {
            const player = this.trackedPlayers[pID];
            const character = player.character;

            // Get the Player's Position

            // First see if the Player is in combat
            // If GAME.combats contains a combat with either the left or right element id being the Player's ID, then the Player is in combat
            // If the Player is in combat, then use the Player's Object Position
            // If the Player is not in combat, then use the Player's Position
            
            let playerPosition = new document.game.THREE.Vector3().copy(character.position()); // Vector3

            if (Object.keys(document.game.GAME.combats).some(cID => document.game.GAME.combats[cID].left.id == pID || document.game.GAME.combats[cID].right.id == pID)) {
                playerPosition = new document.game.THREE.Vector3().copy(character.object.position()); // We are in combat, use the Player's Object Position
            }

            // Offset the Player's Position by the Player's Height (This allows the Player Tag to be above the Player's Head)
            playerPosition.y += character.height;

            // Get the Player's Screen Position
            const playerScreenPosition = this.world_to_screen(playerPosition); // Vector3

            // If character is behind the camera, don't render the tag
            player.tag.style.visibility = playerScreenPosition.z < 1.0 ? 'visible' : 'hidden';
     
            // Set Tag Color based on Friend Status
            player.tag.style.color = character.is_friend ? 'green' : 'lightgray';

            // Update the Player Tag's Position
            player.tag.style.left = playerScreenPosition.x + 'px';
            player.tag.style.top = playerScreenPosition.y + 'px';            
        });
    }


    loginOK() {
        this.doRender = true;
    }

    Network_logoutOK() {
        this.doRender = false;
        this.trackedPlayers = {};
        this.PlayerTagContainer.innerHTML = "";
    }

    handleHidePlayerSettingChange(state: boolean) {
        if ( document.game.GRAPHICS.threeScene.getObjectByName(document.game.GAME.me.id) === undefined) return;
        document.game.GRAPHICS.threeScene.getObjectByName(document.game.GAME.me.id).visible = !state;
    }


    world_to_screen(pos) {
        var p = pos;
        var screenPos = p.project(document.game.GRAPHICS.threeCamera());

        screenPos.x = (screenPos.x + 1) / 2 * document.body.clientWidth;
        screenPos.y = -(screenPos.y - 1) / 2 * document.body.clientHeight;

        return screenPos;
    }

}

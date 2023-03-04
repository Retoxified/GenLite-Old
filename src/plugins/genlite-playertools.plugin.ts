// Import GenLite Plugin Interface
import {GenLitePlugin} from '../core/interfaces/plugin.interface';

// Create PlayerTools Plugin Class
export class GenLitePlayerToolsPlugin implements GenLitePlugin {
    static pluginName = 'GenLitePlayerToolsPlugin';

    // Plugin Settings
    isEnabled: boolean = false; // Enable the plugin (Enabled/Disabled by the user)
    doRender: boolean = false; // Render the plugin's UI (Enabled by LoginOK(), disabled by LogoutOK())

    // Plugin Data
    trackedPlayers = {};

    // Plugin UI
    PlayerTagContainer: HTMLDivElement;

    // Plugin Hooks
    async init() {
        window.genlite.registerPlugin(this);

        // Create and Append the Player Tag Container to the Body
        this.PlayerTagContainer = document.createElement('div');
        this.PlayerTagContainer.className = 'player-tag-container';
        document.body.appendChild(this.PlayerTagContainer);

        // Add Settings to the Settings Menu
        this.isEnabled = window.genlite.settings.add(
            "PlayerHighlights.Enabled",
            true,
            "Enable Player Highlights",
            "checkbox",
            this.handleHighlightSettingChange,
            this);

        window.genlite.settings.add(
            "PlayerTools.HidePlayer",
            false,
            "Hide My Character",
            "checkbox",
            this.handleHidePlayerSettingChange,
            this);

        // Creat HTML Div Element for the Tab Content
        let tabContentElement = document.createElement('div');

        // Create a Header for the Tab
        let tabHeader = document.createElement('h1');
        tabHeader.innerHTML = 'Player Tools';
        tabContentElement.appendChild(tabHeader);

        // Create a Description for the Tab
        let tabDescription = document.createElement('p');
        tabDescription.innerHTML = 'This plugin adds a few tools to help you play the game.';
        tabContentElement.appendChild(tabDescription);
        
        // Funny Meme Image
        let memeImage = document.createElement('img');
        memeImage.src = 'https://ih1.redbubble.net/image.1059709803.4166/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg';
        memeImage.style.width = '100%';
        tabContentElement.appendChild(memeImage);

        


        // Add the Tab to the UI
        window.genlite.ui.addTab('https://icons.iconarchive.com/icons/dtafalonso/modern-xp/32/ModernXP-41-Settings-icon.png', 'Player Tools', tabContentElement);

        let HidePlayer = window.genlite.ui.addSetting('Player Tools', 'Hide Player', 'checkbox', null, false);
        let PlayerHighlightsEnabled = window.genlite.ui.addSetting('Player Tools', 'Player Highlights', 'checkbox', null, this.isEnabled);

        // Bind Events
        HidePlayer.addEventListener('change', (e) => {
            this.handleHidePlayerSettingChange(e.target.checked);
        });

        PlayerHighlightsEnabled.addEventListener('change', (e) => {
            this.handleHighlightSettingChange(e.target.checked);
        });


    }

    update(dt) {
        // Set the Player Tag Container's Visibility to Hidden based off doRender
        this.PlayerTagContainer.style.visibility = this.doRender ? 'visible' : 'hidden';

        // Verify the plugin is enabled and the UI is in a renderable state before continuing
        if (!this.isEnabled || !this.doRender) return;

        // Get World Players
        const worldPlayers = GAME.players;

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
            
            let playerPosition = new THREE.Vector3().copy(character.position()); // Vector3

            if (Object.keys(GAME.combats).some(cID => GAME.combats[cID].left.id == pID || GAME.combats[cID].right.id == pID)) {
                playerPosition = new THREE.Vector3().copy(character.object.position()); // We are in combat, use the Player's Object Position
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

    logoutOK() {
        this.doRender = false;
        this.trackedPlayers = {};
        this.PlayerTagContainer.innerHTML = "";
    }

    // Setting Callbacks
    handleHighlightSettingChange(state: boolean) {
        if (!state) {
            // Clear Tracked Players
            this.trackedPlayers = {};

            // Empty the Player Tag Container
            this.PlayerTagContainer.innerHTML = "";
        }

        this.isEnabled = state;
    }

    handleHidePlayerSettingChange(state: boolean) {
        GRAPHICS.threeScene.getObjectByName(GAME.me.id).visible = !state;
    }


    world_to_screen(pos) {
        var p = pos;
        var screenPos = p.project(GRAPHICS.threeCamera());

        screenPos.x = (screenPos.x + 1) / 2 * window.innerWidth;
        screenPos.y = -(screenPos.y - 1) / 2 * window.innerHeight;

        return screenPos;
    }

}

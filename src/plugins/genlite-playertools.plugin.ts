// Import GenLite Plugin Interface
import {GenLitePlugin} from '../core/interfaces/plugin.interface';

// Create PlayerTools Plugin Class
export class GenLitePlayerToolsPlugin implements GenLitePlugin {
    static pluginName = 'GenLitePlayerToolsPlugin';

    // Plugin Settings
    isEnabled: boolean = false; // Enable the plugin (Enabled/Disabled by the user)
    doRender: boolean = false; // Render the plugin's UI (Enabled by LoginOK(), disabled by LogoutOK())
    doHighlight: boolean = false; // Enable Player Highlights (Enabled/Disabled by the user)
    doHidePlayer: boolean = false; // Hide My Character (Enabled/Disabled by the user)

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

        // Create the UI Tab for the Plugin
        // addTab(tab_icon: string, tab_name: string, tab_content: HTMLElement) 
        
        // Create HTML Element for the Tab Content
        let tabContent = document.createElement('div');
        // Create Form Element for the Tab Content
        let form = document.createElement('form');
        // Create Input Element for the Tab Content
        let input = document.createElement('input');
        // Set the Input Element's Type to Checkbox
        input.type = 'checkbox';
        // Set the Input Element's ID to 'hide-player'
        input.id = 'hide-player';
        // Set the Input Element's Name to 'hide-player'
        input.name = 'hide-player';
        // Set the Input Element's Checked State to false
        input.checked = false;
        // Append the Input Element to the Form Element
        // Add another input element (checkbox) to enable/disable player highlights
        let input2 = document.createElement('input');
        input2.type = 'checkbox';
        input2.id = 'player-highlights';
        input2.name = 'player-highlights';
        input2.checked = false;
 
        // Add event listener to the checkbox
        input2.addEventListener('change', this.handleHighlightSettingChange.bind(this));

        // Add event listener to the checkbox
        input.addEventListener('change', this.handleHidePlayerSettingChange.bind(this));





        form.appendChild(input2);
        form.appendChild(input);
        // Append the Form Element to the Tab Content Element
        tabContent.appendChild(form);
        // Add the Tab to the UI
        window.genlite.ui.addTab('https://icons.iconarchive.com/icons/dtafalonso/modern-xp/32/ModernXP-41-Settings-icon.png', 'Player Tools', tabContent);

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
        this.doHighlight = !this.doHighlight;
        if (!this.doHighlight) {
            // Clear Tracked Players
            this.trackedPlayers = {};

            // Empty the Player Tag Container
            this.PlayerTagContainer.innerHTML = "";
        }

        this.isEnabled = this.doHighlight;
    }

    handleHidePlayerSettingChange(state: boolean) {
        this.doHidePlayer = !this.doHidePlayer;
        GRAPHICS.threeScene.getObjectByName(GAME.me.id).visible = this.doHidePlayer;
    }


    world_to_screen(pos) {
        var p = pos;
        var screenPos = p.project(GRAPHICS.threeCamera());

        screenPos.x = (screenPos.x + 1) / 2 * window.innerWidth;
        screenPos.y = -(screenPos.y - 1) / 2 * window.innerHeight;

        return screenPos;
    }

}

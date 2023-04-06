/*
    Copyright (C) 2022-2023 Retoxified, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteNPCHighlightPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteNPCHighlightPlugin';
    static healthListVersion = "3";

    pluginSettings : Settings = {
        "Invert Hiding": {
            type: "checkbox",
            oldKey: "GenLite.NpcHideInvert.Enable",
            value: true,
            stateHandler: this.handleHideInvertEnableDisable.bind(this)
        },
    };

    trackedNpcs = {};
    npcData = {};
    npc_highlight_div = null;
    render = false;
    npcHealthList: {
        [key: string]: any
        version: string
    };
    curCombat: string = "";
    curEnemy: string = ""

    combatX = 0;
    combatY = 0;

    isPluginEnabled: boolean = false;
    hideInvert: boolean = true;
    isAltDown: boolean = false;

    packList;
    async init() {
        document.genlite.registerPlugin(this);

        this.npc_highlight_div = document.createElement('div');
        this.npc_highlight_div.className = 'npc-indicators-list';
        document.body.appendChild(this.npc_highlight_div);
        this.npcHealthList = JSON.parse(localStorage.getItem("GenliteNPCHealthList"));
        if (this.npcHealthList == null || GenLiteNPCHighlightPlugin.healthListVersion != this.npcHealthList.version)
            this.npcHealthList = { version: GenLiteNPCHighlightPlugin.healthListVersion };
        this.npcData = JSON.parse(localStorage.getItem("GenliteNpcHideData"));
        if (this.npcData == null || GenLiteNPCHighlightPlugin.healthListVersion != this.npcHealthList.version)
            this.npcData = {};

        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));
        window.addEventListener("blur", this.blurHandler.bind(this));
    }

    async postInit() {
        this.packList = document['GenLiteWikiDataCollectionPlugin'].packList;
        document.genlite.ui.registerPlugin("NPC Highlights", "GenLite.NpcHighlight.Enable", this.handlePluginState.bind(this), this.pluginSettings);
    }

    handlePluginState(state: boolean): void {
        // when disabling the plugin clear the current list of npcs
        if (state === false) {
            this.npc_highlight_div.innerHTML = '';
            this.trackedNpcs = {};
        }

        this.isPluginEnabled = state;
    }

    handleHideInvertEnableDisable(state: boolean) {
        // always clear the current list of npcs
        this.npc_highlight_div.innerHTML = '';
        this.trackedNpcs = {};

        this.hideInvert = state;
    }

    Camera_update(dt) {
        if (this.isPluginEnabled === false || this.render === false) {
            return;
        }

        let npcsToAdd = Object.keys(document.game.GAME.npcs).filter(x => !Object.keys(this.trackedNpcs).includes(x));
        let npcsToRemove = Object.keys(this.trackedNpcs).filter(x => !Object.keys(document.game.GAME.npcs).includes(x));

        for (let key in npcsToAdd) {
            let npc = document.game.GAME.npcs[npcsToAdd[key]]
            let hpKey = this.packList[npc.id.split('-')[0]]
            let text = npc.htmlName;        
            if (this.npcHealthList[hpKey] !== undefined)
                text += ` HP: ${this.npcHealthList[hpKey]}`
            text += `
            <div class="genlite-npc-setting" style="display: ${this.isAltDown ? "inline-block" : "none"}; pointer-events: auto;" onclick="document.${GenLiteNPCHighlightPlugin.pluginName}.hide_npc('${hpKey}');void(0);"> &#8863;</div>`;
            this.trackedNpcs[npcsToAdd[key]] = this.create_text_element(hpKey, text);
            this.trackedNpcs[npcsToAdd[key]].hasHp = this.npcHealthList[hpKey] !== undefined;

        }

        for (let key in npcsToRemove) {
            this.trackedNpcs[npcsToRemove[key]].remove();
            delete this.trackedNpcs[npcsToRemove[key]];
        }

        for (let key in this.trackedNpcs) {
            let worldPos;
            if (document.game.GAME.npcs[key] !== undefined) {
                /* if the health was updated but the npc tag doesnt have that set regen the tag */
                if (!this.trackedNpcs[key].hasHp && this.npcHealthList[this.packList[key.split('-')[0]]]) {
                    this.trackedNpcs[key].remove();
                    delete this.trackedNpcs[key];
                    continue;
                }

                /* if in combat grab the threeObject position (the actual current position of the sprite not the world pos)
                    mult by 0.8 which is the height of the health bar
                */
                if (key == this.curEnemy) {
                    worldPos = new document.game.THREE.Vector3().copy(document.game.GAME.npcs[key].object.position());
                    worldPos.y += 0.8;
                } else {
                    worldPos = new document.game.THREE.Vector3().copy(document.game.GAME.npcs[key].position());
                    worldPos.y += document.game.GAME.npcs[key].height
                }
                let screenPos = this.world_to_screen(worldPos);
                if (key == this.curEnemy)
                    screenPos.y *= 0.9; // move the name tag a fixed position above the name tag
                let zHide = screenPos.z > 1.0; //if behind camera
                let npcHide = this.hideInvert ? this.npcData[this.packList[key.split('-')[0]]] == 1 : !(this.npcData[this.packList[key.split('-')[0]]] == 1);
                if (zHide || (npcHide && !this.isAltDown)) {
                    this.trackedNpcs[key].style.visibility = 'hidden';
                } else {
                    this.trackedNpcs[key].style.visibility = 'visible';
                }
                this.trackedNpcs[key].style.top = screenPos.y + "px";
                this.trackedNpcs[key].style.left = screenPos.x + "px";
            }
        }
    }

    loginOK() {
        this.render = true;
    }

    Network_logoutOK() {
        this.npc_highlight_div.innerHTML = '';
        this.trackedNpcs = {};
        this.render = false;
    }

    /* figure out which npc we are fighting and when that combat ends */
    Network_handle(verb, payload) {
        if (this.isPluginEnabled === false || document.game.NETWORK.loggedIn === false) {
            return;
        }

        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == document.game.PLAYER.id || payload.participant2 == document.game.PLAYER.id)) {
            this.curCombat = payload.id;
            let curCombat = document.game.GAME.combats[payload.id];
            this.curEnemy = curCombat.left.id == document.game.PLAYER.id ? curCombat.right.id : curCombat.left.id;
            return;
        }
        if (verb == "removeObject" && payload.type == "combat" && payload.id == this.curCombat) {
            this.curCombat = "";
            this.curEnemy = "";
            return;
        }
    }

    Game_combatUpdate(update) {
        if (this.isPluginEnabled === false) {
            return;
        }
        let object = document.game.GAME.objectById(update.id);
        if (update.id == document.game.PLAYER.id || document.game.GAME.players[update.id] !== undefined || object === undefined)
            return;

        let hpKey = this.packList[object.id.split('-')[0]];
        if (hpKey === undefined)
            return;

        let npcsToMod;
        if (this.npcHealthList[hpKey] === undefined) {
            this.npcHealthList[hpKey] = update.maxhp;
            localStorage.setItem("GenliteNPCHealthList", JSON.stringify(this.npcHealthList));
        }
        npcsToMod = Object.keys(document.game.GAME.npcs).filter(x => document.game.GAME.npcs[x].id.split('-')[0] == object.id.split('-')[0]);
        for (let key in npcsToMod) {
            let npcid = npcsToMod[key];

            if (this.trackedNpcs[npcid] === undefined || this.trackedNpcs[npcid].hasHp) {
                continue;
            }

            this.trackedNpcs[npcid].innerHTML += ` HP: ${this.npcHealthList[hpKey]}`;
            this.trackedNpcs[npcid].hasHp = true;
        }
        if (this.trackedNpcs.hasOwnProperty(object.id))
            this.trackedNpcs[object.id].innerHTML = `<div>${object.htmlName}</div><div>HP: ${update.hp}/${update.maxhp}</div>`;
    }


    world_to_screen(pos) {
        var p = pos;
        var screenPos = p.project(document.game.GRAPHICS.threeCamera());

        screenPos.x = (screenPos.x + 1) / 2 * document.body.clientWidth;
        screenPos.y = -(screenPos.y - 1) / 2 * document.body.clientHeight;

        return screenPos;
    }

    create_text_element(key, text) {
        let element = document.createElement('div');
        if (this.hideInvert) {
            element.className = this.npcData[key] == 1 ? 'spell-locked' : 'text-yellow';
        } else {
            element.className = this.npcData[key] == 1 ? 'text-yellow' : 'spell-locked';
        }
        element.style.position = 'absolute';
        //element.style.zIndex = '99999';
        element.innerHTML = text;
        element.style.transform = 'translateX(-50%)';
        element.style.fontFamily = 'acme, times new roman, Times, serif'; // Set Font
        element.style.textShadow = '-1px -1px 0 #000,0   -1px 0 #000, 1px -1px 0 #000, 1px  0   0 #000, 1px  1px 0 #000, 0    1px 0 #000, -1px  1px 0 #000, -1px  0   0 #000';
        element.style.pointerEvents = 'none';

        this.npc_highlight_div.appendChild(element);

        return element;
    }

    hide_npc(packId) {
        if (!this.npcData.hasOwnProperty(packId))
            this.npcData[packId] = 0;

        if (this.npcData[packId] != 1)
            this.npcData[packId] = 1;
        else
            this.npcData[packId] = 0;

        this.save_item_list();
    }

    save_item_list() {
        this.npc_highlight_div.innerHTML = '';
        this.trackedNpcs = {};
        localStorage.setItem("GenliteNpcHideData", JSON.stringify(this.npcData));
    }


    keyDownHandler(event) {
        if (event.key !== "Alt")
            return;

        event.preventDefault();
        if (!event.repeat) {
            this.isAltDown = true;
            this.setDisplayState("inline-block");
        }
    }
    keyUpHandler(event) {
        if (event.key !== "Alt")
            return;

        event.preventDefault();

        this.isAltDown = false;
        this.setDisplayState("none");
    }

    blurHandler() {
        this.isAltDown = false;
        this.setDisplayState("none");
    }

    setDisplayState(state) {
        const hiddenElements = document.querySelectorAll('.genlite-npc-setting') as NodeListOf<HTMLElement>;

        hiddenElements.forEach((element) => {
            element.style.display = state;
        });
    }
}

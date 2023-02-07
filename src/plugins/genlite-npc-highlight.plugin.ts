export class GenLiteNPCHighlightPlugin {
    static pluginName = 'GenLiteNPCHighlightPlugin';

    trackedNpcs = {};
    npc_highlight_div = null;
    render = false;
    npcHealthList = {};
    curCombat: string = "";
    curEnemy: string = ""

    combatX = 0;
    combatY = 0;

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.npc_highlight_div = document.createElement('div');
        this.npc_highlight_div.className = 'npc-indicators-list';
        document.body.appendChild(this.npc_highlight_div);
        this.npcHealthList = JSON.parse(localStorage.getItem("GenliteNPCHealthList"));
        if (this.npcHealthList == null)
            this.npcHealthList = {};

        this.isPluginEnabled = window.genlite.settings.add("NpcHighlight.Enable", true, "Highlight NPCs", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        // when disabling the plugin clear the current list of npcs
        if (state === false) {
            this.npc_highlight_div.innerHTML = '';
            this.trackedNpcs = {};
        }

        this.isPluginEnabled = state;
    }

    update(dt) {
        if (this.isPluginEnabled === false || this.render === false) {
            return;
        }

        let npcsToAdd = Object.keys(GAME.npcs).filter(x => !Object.keys(this.trackedNpcs).includes(x));
        let npcsToRemove = Object.keys(this.trackedNpcs).filter(x => !Object.keys(GAME.npcs).includes(x));

        for (let key in npcsToAdd) {
            let npc = GAME.npcs[npcsToAdd[key]]
            let hpKey = `${npc.info.name}-${npc.info.level ? npc.info.level : 0}`;
            let text = npc.htmlName;
            if (this.npcHealthList[hpKey] !== undefined)
                text += ` HP: ${this.npcHealthList[hpKey]}`
            this.trackedNpcs[npcsToAdd[key]] = this.create_text_element(npcsToAdd[key], text);
        }

        for (let key in npcsToRemove) {
            this.trackedNpcs[npcsToRemove[key]].remove();
            delete this.trackedNpcs[npcsToRemove[key]];
        }

        for (let key in this.trackedNpcs) {
            let worldPos;
            if (GAME.npcs[key] !== undefined) {
                /* if in combat grab the threeObject position (the actual current position of the sprite not the world pos)
                    mult by 0.8 which is the height of the health bar
                */
                if (key == this.curEnemy) {
                    worldPos = new THREE.Vector3().copy(GAME.npcs[key].object.position());
                    worldPos.y += 0.8;
                } else {
                    worldPos = new THREE.Vector3().copy(GAME.npcs[key].position());
                    worldPos.y += GAME.npcs[key].height
                }
                let screenPos = this.world_to_screen(worldPos);
                if (key == this.curEnemy)
                    screenPos.y *= 0.9; // move the name tag a fixed position above the name tag

                if (screenPos.z > 1.0) {
                    this.trackedNpcs[key].style.visibility = 'hidden'; // Behind camera, hide
                } else {
                    this.trackedNpcs[key].style.visibility = 'visible'; // In front of camera, show
                }
                this.trackedNpcs[key].style.top = screenPos.y + "px";
                this.trackedNpcs[key].style.left = screenPos.x + "px";

            }
        }
    }

    loginOK() {
        this.render = true;
    }

    logoutOK() {
        this.npc_highlight_div.innerHTML = '';
        this.trackedNpcs = {};
        this.render = false;
    }

    /* figure out which npc we are fighting and when that combat ends */
    handle(verb, payload) {
        if (this.isPluginEnabled === false || NETWORK.loggedIn === false) {
            return;
        }

        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {
            this.curCombat = payload.id;
            let curCombat = GAME.combats[payload.id];
            this.curEnemy = curCombat.left.id == PLAYER.id ? curCombat.right.id : curCombat.left.id;
            return;
        }
        if (verb == "removeObject" && payload.type == "combat" && payload.id == this.curCombat) {
            this.curCombat = "";
            this.curEnemy = "";
            return;
        }
    }

    combatUpdate(update) {
        if (this.isPluginEnabled === false) {
            return;
        }
        let object = GAME.objectById(update.id);
        if (update.id == PLAYER.id || GAME.players[update.id] !== undefined || object === undefined)
            return;

        let hpKey = `${object.info.name}-${object.info.level ? object.info.level : 0}`;

        let npcsToMod;
        if (this.npcHealthList[hpKey] === undefined) {
            this.npcHealthList[hpKey] = update.maxhp;
            localStorage.setItem("GenliteNPCHealthList", JSON.stringify(this.npcHealthList));
            npcsToMod = Object.keys(GAME.npcs).filter(x => GAME.npcs[x].htmlName == object.htmlName);
        }
        for (let key in npcsToMod) {
            let npcid = npcsToMod[key];
            this.trackedNpcs[npcid].innerHTML += ` HP: ${this.npcHealthList[hpKey]}`;
        }
        if (this.trackedNpcs.hasOwnProperty(object.id))
            this.trackedNpcs[object.id].innerHTML = `<div>${object.htmlName}</div><div>HP: ${update.hp}/${update.maxhp}</div>`;
    }


    world_to_screen(pos) {
        var p = pos;
        var screenPos = p.project(GRAPHICS.threeCamera());

        screenPos.x = (screenPos.x + 1) / 2 * window.innerWidth;
        screenPos.y = -(screenPos.y - 1) / 2 * window.innerHeight;

        return screenPos;
    }

    create_text_element(key, text) {
        let element = document.createElement('div');
        element.className = 'text-yellow'
        element.style.position = 'absolute';
        //element.style.zIndex = '99999';
        element.innerHTML = text;
        element.style.transform = 'translateX(-50%)';
        element.style.textShadow = '-1px -1px 0 #000,0   -1px 0 #000, 1px -1px 0 #000, 1px  0   0 #000, 1px  1px 0 #000, 0    1px 0 #000, -1px  1px 0 #000, -1px  0   0 #000';
        element.style.pointerEvents = 'none';

        this.npc_highlight_div.appendChild(element);

        return element;
    }
}

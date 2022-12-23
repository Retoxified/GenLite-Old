export class GenLiteNPCHighlightPlugin {
    static pluginName = 'GenLiteNPCHighlightPlugin';

    trackedNpcs = {};
    npc_highlight_div = null;
    render = false;
    npcHealthList = {};

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.npc_highlight_div = document.createElement( 'div' );
        this.npc_highlight_div.className = 'npc-indicators-list';
        document.body.appendChild(this.npc_highlight_div);
        this.npcHealthList = JSON.parse(localStorage.getItem("GenliteNPCHealthList"));
        if(this.npcHealthList == null)
            this.npcHealthList = {};

        this.isPluginEnabled = window.genlite.settings.add("NpcHighlight.Enable", true, "Highlight NPCs", "checkbox", this.handlePluginEnableDisable, this);
    }

    handlePluginEnableDisable(state: boolean) {
        // when disabling the plugin clear the current list of npcs
        if(state === false) {
            this.npc_highlight_div.innerHTML = '';
            this.trackedNpcs = {};
        }

        this.isPluginEnabled = state;
    }

    update(dt) {
        if(this.isPluginEnabled === false || this.render === false) {
            return;
        }

        let npcsToAdd = Object.keys(GAME.npcs).filter( x => !Object.keys(this.trackedNpcs).includes(x) );
        let npcsToRemove = Object.keys(this.trackedNpcs).filter( x => !Object.keys(GAME.npcs).includes(x) );

        for(let key in npcsToAdd) {
            let npc = GAME.npcs[npcsToAdd[key]]
            let hpKey = `${npc.info.name}-${npc.info.level}`;
            let text = npc.htmlName;
            if (this.npcHealthList[hpKey] !== undefined)
                text += ` HP: ${this.npcHealthList[hpKey]}`
            this.trackedNpcs[npcsToAdd[key]] = this.create_text_element(npcsToAdd[key], text);
        }

        for(let key in npcsToRemove) {
            this.trackedNpcs[npcsToRemove[key]].remove();
            delete this.trackedNpcs[npcsToRemove[key]];
        }

        for(let key in this.trackedNpcs) {
            if(GAME.npcs[key] !== undefined) {
                let worldPos = new THREE.Vector3().copy(GAME.npcs[key].position());
                worldPos.y += GAME.npcs[key].height
                let screenPos = this.world_to_screen(worldPos);

                if(screenPos.z > 1.0) {
                    this.trackedNpcs[key].style.visibility = 'hidden'; // Behind camera, hide
                } else {
                    this.trackedNpcs[key].style.visibility = 'visible'; // In front of camera, show
                }
                this.trackedNpcs[key].style.left = screenPos.x + "px";
                this.trackedNpcs[key].style.top = screenPos.y + "px";
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

    combatUpdate(update) {
        if(this.isPluginEnabled === false) {
            return;
        }
        let object = GAME.objectById(update.id);
        if (!object || !object.object || object.object.constructor.name !== "MonsterCharacter")
            return;
        let hpKey = `${object.info.name}-${object.info.level}`;

        let npcsToMod;
        if(this.npcHealthList[hpKey] === undefined) {
            this.npcHealthList[hpKey] = update.maxhp;
            localStorage.setItem("GenliteNPCHealthList", JSON.stringify(this.npcHealthList));
            npcsToMod = Object.keys(GAME.npcs).filter( x => GAME.npcs[x].htmlName == object.htmlName);
        }
        for (let key in npcsToMod){
            let npcid = npcsToMod[key];
            this.trackedNpcs[npcid].innerHTML += ` HP: ${this.npcHealthList[hpKey]}`;
        }
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
        let element = document.createElement( 'div' );
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

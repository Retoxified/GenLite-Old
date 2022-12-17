// ==UserScript==
// @name         GenLite Item Highlight
// @namespace    GenLite
// @version      0.1.2
// @description  try to take over the world!
// @author       TwistedFate#4053
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==

(function() {
    class GenLiteItemHighlight {
        trackedItems = {};
        item_highlight_div = null;
        render = false;

        init() {
            window.genlite.registerModule(this);

            this.item_highlight_div = document.createElement( 'div' );
            this.item_highlight_div.className = 'item-indicators-list';
            document.body.appendChild(this.item_highlight_div);
        }

        update(dt) {
            if(this.render == false) {
                return;
            }

            let stack_counter = {};
            let itemsToAdd = Object.keys(GAME.items).filter( x => !Object.keys(this.trackedItems).includes(x) );
            let itemsToRemove = Object.keys(this.trackedItems).filter( x => !Object.keys(GAME.items).includes(x) );

            for(let key in itemsToAdd) {
                this.trackedItems[itemsToAdd[key]] = this.create_text_element(itemsToAdd[key], GAME.items[itemsToAdd[key]]);
            }

            for(let key in itemsToRemove) {
                this.trackedItems[itemsToRemove[key]].remove();
                delete this.trackedItems[itemsToRemove[key]];
            }

            for(let key in this.trackedItems) {
                if(GAME.items[key] !== undefined) {
                    let posKey = GAME.items[key].pos2.x+','+GAME.items[key].pos2.y;
                    if(stack_counter[posKey] === undefined) {
                        stack_counter[posKey] = 0;
                    }

                    let worldPos = new THREE.Vector3().copy(GAME.items[key].position());
                    worldPos.y += 0.5;
                    let screenPos = this.world_to_screen(worldPos, stack_counter[posKey]);
                    if(screenPos.z > 1.0) {
                        this.trackedItems[key].style.visibility = 'hidden'; // Behind camera, hide
                    } else {
                        this.trackedItems[key].style.visibility = 'visible'; // In front of camera, show
                    }
                    this.trackedItems[key].style.left = screenPos.x + "px";
                    this.trackedItems[key].style.top = screenPos.y + "px";

                    stack_counter[posKey]++;
                }
            }
        }

        loginOK() {
            this.render = true;
        }
        logoutOK() {
            this.item_highlight_div.innerHTML = '';
            this.trackedItems = {};
            this.render = false;
        }

        world_to_screen(pos, stack_count) {
            var p = pos;
            var screenPos = p.project(GRAPHICS.threeCamera());

            screenPos.x = (screenPos.x + 1) / 2 * window.innerWidth;
            screenPos.y = -(screenPos.y - 1) / 2 * window.innerHeight - (stack_count * 15);

            return screenPos;
        }

        getItemValue(item) {
            let itemDefId = item.definition.item;
            let quantity = item.definition.quantity ?? 1;

            if (itemDefId.startsWith('$scrip-')) {
                itemDefId = itemDefId.substring(7);
                quantity *= 5;
            }

            let gameValue = DATA.items[itemDefId].value ?? 1;
            return gameValue * quantity;
        }

        getItemColor(item) {
            let itemValue = this.getItemValue(item);

            if(itemValue >= 10000) {
                return 'text-ran';
            } else if(itemValue >= 5000) {
                return 'text-purple';
            } else if(itemValue >= 1000) {
                return 'text-magenta';
            } else if(itemValue >= 500) {
                return 'text-gold';
            } else if(itemValue >= 100) {
                return 'text-limegreen';
            } else {
                return 'text-white';
            }
        }

        create_text_element(key, item) {
            let element = document.createElement( 'div' );

            let itemDefId = item.definition.item;
            let stackable = false;
            if (itemDefId.startsWith('$scrip-')) {
                itemDefId = itemDefId.substring(7);
                stackable = true;
            } else {
                stackable = DATA.items[itemDefId].stackable ?? false;
            }

            element.className = this.getItemColor(item);
            element.style.position = 'absolute';
            //element.style.zIndex = '99999';
            element.innerHTML = item.item_name;
            if(stackable === true) {
                element.innerHTML = `${item.item_name}(${item.definition.quantity})`;
            }
            element.style.transform = 'translateX(-50%)';
            element.style.textShadow = '-1px -1px 0 #000,0   -1px 0 #000, 1px -1px 0 #000, 1px  0   0 #000, 1px  1px 0 #000, 0    1px 0 #000, -1px  1px 0 #000, -1px  0   0 #000';
            element.style.pointerEvents = 'none';

            this.item_highlight_div.appendChild(element);

            return element;
        }
    }

    window.genliteItemHighlight = new GenLiteItemHighlight();

    let gameLoadTimer = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteItemHighlight.init();
                clearInterval(gameLoadTimer);
            }
        } catch (e) {
        }
    }, 1000);
})();
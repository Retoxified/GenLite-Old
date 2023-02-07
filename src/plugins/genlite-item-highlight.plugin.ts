export class GenLiteItemHighlightPlugin {
    static pluginName = 'GenLiteItemHighlightPlugin';

    itemElements = [];
    trackedItems = [];
    itemData = {};
    item_highlight_div = null;
    render = false;

    isAltDown: boolean = false;
    originalItemIntersects: Function
    styleRuleIndex: number = -1

    isPluginEnabled: boolean = false;
    doCondenseItems: boolean = false;
    hideLables: boolean = false;

    async init() {
        window.genlite.registerModule(this);

        this.originalItemIntersects = WorldItem.prototype.intersects;

        let storedItemData = localStorage.getItem("genliteItemData")
        if (storedItemData !== null) {
            this.itemData = JSON.parse(storedItemData);
        }

        this.item_highlight_div = document.createElement('div');
        this.item_highlight_div.className = 'item-indicators-list';
        document.body.appendChild(this.item_highlight_div);
        this.isPluginEnabled = window.genlite.settings.add("ItemHighlight.Enable", true, "Highlight Items", "checkbox", this.handlePluginEnableDisable, this, undefined, undefined);
        this.doCondenseItems = window.genlite.settings.add("CondenseItems.Enable", true, "Condense Items", "checkbox", this.handleCondeseEnableDisable, this, undefined, undefined, "ItemHighlight.Enable");
        this.hideLables = window.genlite.settings.add("HideItemLabels.Enable", false, "Hide Item Labels", "checkbox", this.handleHideLabelsEnableDisable, this, undefined, undefined, "ItemHighlight.Enable");

        let storedPriorityColor = window.genlite.settings.add("ItemHighlight.PriorityColor", "#ffa500", "Priority Item Color", "color", this.handleColorChange, this, undefined, undefined, "ItemHighlight.Enable");

        let sheet = document.styleSheets[0];
        this.styleRuleIndex = sheet.insertRule(`.genlite-priority-item { color: ${storedPriorityColor}; }`, sheet.cssRules.length);

        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));
        window.addEventListener("blur", this.blurHandler.bind(this))

        if (this.isPluginEnabled === true) {
            WorldItem.prototype.intersects = this.worlditem_intersects_priority;
        }
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

    handlePluginEnableDisable(state: boolean) {
        // when disabling the plugin clear the current list of items
        if (state === false) {
            this.item_highlight_div.innerHTML = '';
            this.itemElements = [];
            this.trackedItems = [];
            WorldItem.prototype.intersects = this.originalItemIntersects
        } else {
            WorldItem.prototype.intersects = this.worlditem_intersects_priority;
        }

        this.isPluginEnabled = state;
    }

    handleCondeseEnableDisable(state: boolean) {
        // no matter what clear the current items to refresh the display
        this.item_highlight_div.innerHTML = '';
        this.itemElements = [];
        this.trackedItems = [];
        this.doCondenseItems = state;
    }

    handleHideLabelsEnableDisable(state: boolean) {
        // no matter what clear the current items to refresh the display
        this.item_highlight_div.innerHTML = '';
        this.itemElements = [];
        this.trackedItems = [];
        this.hideLables = state;
    }


    handleColorChange(value: string) {
        let sheet = document.styleSheets[0] as any;

        sheet.cssRules[this.styleRuleIndex].style.color = value;
    }

    update(dt) {
        if (this.isPluginEnabled === false || this.render == false) {
            return;
        }

        let stack_counter = {};
        let itemsToAdd = Object.keys(GAME.items).filter(x => !this.trackedItems.includes(x));
        let itemsToRemove = this.trackedItems.filter(x => !Object.keys(GAME.items).includes(x));


        for (let key in itemsToAdd) {
            let item = GAME.items[itemsToAdd[key]];
            if (!this.doCondenseItems) {
                this.itemElements.push(this.create_text_element(itemsToAdd[key], item));
                this.trackedItems.push(itemsToAdd[key]);
                return;
            }
            let isNewTag = true;
            for (let tKey in this.itemElements) {
                let tItem = this.itemElements[tKey];
                if (tItem.item_name == item.item_name && tItem.x == item.pos2.x && tItem.y == item.pos2.y) {
                    tItem.itemIds.push(itemsToAdd[key]);
                    this.update_text_element(tItem);
                    isNewTag = false;
                    break;
                }
            }
            if (isNewTag)
                this.itemElements.push(this.create_text_element(itemsToAdd[key], item));
            this.trackedItems.push(itemsToAdd[key]);
        }

        for (let key in itemsToRemove) {
            let remove = -1;
            this.trackedItems.splice(this.trackedItems.indexOf(itemsToRemove[key]), 1)
            for (let tKey in this.itemElements) {
                let tItem = this.itemElements[tKey];
                let index = tItem.itemIds.indexOf(itemsToRemove[key]);
                if (index != -1) {
                    tItem.itemIds.splice(index, 1);
                    if (tItem.itemIds.length == 0)
                        remove = parseInt(tKey);
                    this.update_text_element(tItem);
                    break;
                }
            }
            if (remove != -1) {
                this.itemElements[remove].element.remove();
                delete this.itemElements[remove].element;
                delete this.itemElements[remove].itemIds;
                delete this.itemElements[remove].item_name;
                delete this.itemElements[remove].stackable;
                this.itemElements.splice(remove, 1);
            }

        }

        for (let i in this.itemElements) {
            let key = this.itemElements[i].itemIds[0];
            if (GAME.items[key] !== undefined) {
                if ((this.get_item_data(GAME.items[key].definition.item) == -1 || this.hideLables) && !this.isAltDown) {
                    this.itemElements[i].element.style.visibility = 'hidden';
                    continue;
                }
                let posKey = GAME.items[key].pos2.x + ',' + GAME.items[key].pos2.y;
                if (stack_counter[posKey] === undefined) {
                    stack_counter[posKey] = 0;
                }

                let worldPos = new THREE.Vector3().copy(GAME.items[key].position());
                worldPos.y += 0.5;
                let screenPos = this.world_to_screen(worldPos, stack_counter[posKey]);
                if (screenPos.z > 1.0) {
                    this.itemElements[i].element.style.visibility = 'hidden'; // Behind camera, hide
                } else {
                    this.itemElements[i].element.style.visibility = 'visible'; // In front of camera, show
                }
                this.itemElements[i].element.style.left = screenPos.x + "px";
                this.itemElements[i].element.style.top = screenPos.y + "px";

                stack_counter[posKey]++;
            }
        }
    }

    loginOK() {
        this.render = true;
    }
    logoutOK() {
        this.item_highlight_div.innerHTML = '';
        this.itemElements = [];
        this.trackedItems = [];
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
        let itemPriority = this.get_item_data(item.definition.item)
        if (itemPriority == -1) {
            return "spell-locked";
        } else if (itemPriority == 1) {
            return "genlite-priority-item";
        }

        let itemValue = this.getItemValue(item);

        if (itemValue >= 10000) {
            return 'text-ran';
        } else if (itemValue >= 5000) {
            return 'text-purple';
        } else if (itemValue >= 1000) {
            return 'text-magenta';
        } else if (itemValue >= 500) {
            return 'text-gold';
        } else if (itemValue >= 100) {
            return 'text-limegreen';
        } else {
            return 'text-white';
        }
    }

    create_text_element(key, item) {
        let element = document.createElement('div');

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
        let item_name = item.item_name;
        if (stackable === true) {
            item_name = `${item.item_name}(${item.definition.quantity})`;
        }
        element.innerHTML = `<span style="display: inline-block;">${item_name}</span>
                             <div class="genlite-item-setting" style="display: ${this.isAltDown ? "inline-block" : "none"}; pointer-events: auto;" onclick="window.${GenLiteItemHighlightPlugin.pluginName}.hide_item('${itemDefId}');void(0);"> &#8863;</div>
                             <div class="genlite-item-setting" style="display: ${this.isAltDown ? "inline-block" : "none"}; pointer-events: auto;" onclick="window.${GenLiteItemHighlightPlugin.pluginName}.important_item('${itemDefId}');void(0);"> &#8862;</div>`;
        element.style.transform = 'translateX(-50%)';
        element.style.pointerEvents = "none";
        element.style.textShadow = '-1px -1px 0 #000,0   -1px 0 #000, 1px -1px 0 #000, 1px  0   0 #000, 1px  1px 0 #000, 0    1px 0 #000, -1px  1px 0 #000, -1px  0   0 #000';

        this.item_highlight_div.appendChild(element);

        return { "element": element, "itemIds": [item.id], "item_name": item.item_name, "stackable": stackable, x: item.pos2.x, y: item.pos2.y };
    }

    update_text_element(item) {
        let quantity = 0
        for (let key in GAME.items) {
            let gItem = GAME.items[key];
            if (gItem.item_name == item.item_name && item.x == gItem.pos2.x && item.y == gItem.pos2.y) {
                if (item.stackable) {
                    quantity += gItem.definition.quantity;
                } else {
                    quantity++;
                }
            }
        }
        if (quantity == 1) {
            item.element.children[0].innerText = `${item.item_name}`
        } else {
            item.element.children[0].innerText = `${item.item_name}(${quantity})`
        }
    }

    hide_item(item_key) {
        if (!this.itemData.hasOwnProperty(item_key))
            this.itemData[item_key] = 0;

        if (this.itemData[item_key] != -1)
            this.itemData[item_key] = -1;
        else
            this.itemData[item_key] = 0;

        this.save_item_list();
    }

    important_item(item_key) {
        if (!this.itemData.hasOwnProperty(item_key))
            this.itemData[item_key] = 0;

        if (this.itemData[item_key] != 1)
            this.itemData[item_key] = 1;
        else
            this.itemData[item_key] = 0;

        this.save_item_list();
    }

    worlditem_intersects_priority(ray, list) {
        const self = (this as any);

        let i = ray.intersectObject(self.sprite);
        if (!i || i.length == 0)
            return;
        list.push({
            color: 'green',
            distance: i.distance,
            priority: -1,
            object: self,
            text: "Examine",
            action: () => CHAT.addGameMessage(self.item_examine)
        });
        list.push({
            color: 'red',
            distance: i.distance,
            priority: 1 + window[GenLiteItemHighlightPlugin.pluginName].get_item_data(self.definition.item) * 50,
            object: self,
            text: "Take",
            action: () => NETWORK.action('take', {
                item: self.id
            })
        });
    }
    get_item_data(item_key) {
        if (!this.itemData.hasOwnProperty(item_key))
            return 0;

        return this.itemData[item_key];
    }

    save_item_list() {
        this.item_highlight_div.innerHTML = '';
        this.itemElements = [];
        this.trackedItems = [];

        localStorage.setItem("genliteItemData", JSON.stringify(this.itemData));
    }

    setDisplayState(state) {
        const hiddenElements = document.querySelectorAll('.genlite-item-setting') as NodeListOf<HTMLElement>;

        hiddenElements.forEach((element) => {
            element.style.display = state;
        });
    }
}

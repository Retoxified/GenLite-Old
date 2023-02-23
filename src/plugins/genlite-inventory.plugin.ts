export class GenLiteInventoryPlugin {
    static pluginName = 'GenLiteInventoryPlugin';

    disableDragOnShift: boolean = false;

    async init() {
        window.genlite.registerModule(this);
        this.disableDragOnShift = window.genlite.settings.add(
            "Inventory.ShiftDisableDrag",
            true,
            "Disable Dragging w/ Shift",
            "checkbox",
            this.handleDisableDrag,
            this
        );
    }

    public loginOK() {
        this.updateState();
    }

    handleDisableDrag(state: boolean) {
        this.disableDragOnShift = state;
        this.updateState();
    }

    updateState() {
        if (this.disableDragOnShift) {
            for (const i in INVENTORY.DOM_slots) {
                let slot = INVENTORY.DOM_slots[i];
                slot.item_div.onmousedown = function (e) {
                    if (e.shiftKey) {
                        e.preventDefault();
                    }
                }
            }
        } else {
            for (const i in INVENTORY.DOM_slots) {
                let slot = INVENTORY.DOM_slots[i];
                slot.item_div.onmousedown = function (e) {};
            }
        }
    }

}

export class GenliteMenuScaler {
    static pluginName = 'GenliteMenuScaler';

    scaleList;

    isPluginEnabled: boolean = false;

    async init() {
        window.genlite.registerModule(this);
        this.scaleList = {};
        this.isPluginEnabled = window.genlite.settings.add("MenuScaler.Enable", true, "MenuScaler", "checkbox", this.handlePluginEnableDisable, this);
        this.scaleList.rightClick = window.genlite.settings.add("MenuScalerRightCLick.1", true, "Scale Right Click Menu", "range", this.scaleRightClick, this, undefined,
            [['min', '0.1'], ['max', '4'], ['step', '0.1'], ['value', '1']]);
    }

    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        let menu = <HTMLDivElement> document.getElementById("new_ux-contextual-menu-modal");
        if(state){
            menu.style.transform = `scale(${this.scaleList.rightClick})`;
        } else {
            menu.style.transform = "";
        }
    }

    scaleRightClick(scaler: Number) {
        this.scaleList.rightClick = scaler;
        if(!this.isPluginEnabled){
            return;
        }
        let menu = document.getElementById("new_ux-contextual-menu-modal");
        menu.style.transform = `scale(${scaler})`;
    }

    initializeUI(){
        if(!this.isPluginEnabled){
            return;
        }
        let menu = document.getElementById("new_ux-contextual-menu-modal");
        menu.style.transform = `scale(${this.scaleList.rightClick})`;
    }
}

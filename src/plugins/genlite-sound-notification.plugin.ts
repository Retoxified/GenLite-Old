export class GenLiteSoundNotification {
    static pluginName = 'GenLiteSoundNotification';

    doHealthCheck: boolean = false;
    healthThreshold;


    async init() {
        window.genlite.registerModule(this);
        this.doHealthCheck = window.genlite.settings.add("LowHealth.Enable", false, "Low Health Sound", "checkbox", this.handleDoHealthCheck, this);
        //this is a stupid ass thing but *shrug*
        this.healthThreshold = window.genlite.settings.add("LowHealth.0", 0, "Low Health Threshold: <div style=\"display: contents;\" id=\"GenLiteHealthThresholdOutput\"></div>", "range", this.setHealthThreshold, this, undefined,
            [['min', '1'], ['max', '100'], ['step', '1'], ['value', '0']], "LowHealth.Enable");
        document.getElementById("GenLiteHealthThresholdOutput").innerText = ` ${this.healthThreshold}%`
    }

    handleDoHealthCheck(state: boolean) {
        this.doHealthCheck = state;
    }

    setHealthThreshold(threshold: number) {
        this.healthThreshold = threshold;
        document.getElementById("GenLiteHealthThresholdOutput").innerText = ` ${this.healthThreshold}%`
    }

    combatUpdate(update) {
        if (update.id != PLAYER.id)
            return;
        if ((update.hp / update.maxhp) <= (this.healthThreshold / 100) && this.doHealthCheck)
            SFX_PLAYER.play('spell-failure');
    }
}
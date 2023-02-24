import {GenLitePlugin} from '../core/interfaces/plugin.interface';

export class GenLiteSoundNotification implements GenLitePlugin {
    static pluginName = 'GenLiteSoundNotification';

    doHealthCheck: boolean = false;
    healthThreshold;

    doInvCheck: boolean = false;
    invThreshold;
    prevSlotsUsed = null;

    overrideIGNVolume: boolean = false;
    overrideVolume;

    genliteSoundListener;
    genliteSFXPlayer;
    playerInUse;


    async init() {
        window.genlite.registerPlugin(this);
        this.doHealthCheck = window.genlite.settings.add("LowHealth.Enable", false, "Low Health Sound", "checkbox", this.handleDoHealthCheck, this);
        //this is a stupid ass thing but *shrug*
        this.healthThreshold = window.genlite.settings.add("LowHealth.0", 0, "Low Health Threshold: <div style=\"display: contents;\" id=\"GenLiteHealthThresholdOutput\"></div>", "range", this.setHealthThreshold, this, undefined,
            [['min', '1'], ['max', '100'], ['step', '1'], ['value', '0']], "LowHealth.Enable");
        document.getElementById("GenLiteHealthThresholdOutput").innerText = ` ${this.healthThreshold}%`

        this.doInvCheck = window.genlite.settings.add("InvCheck.Enable", false, "Inventory Space Sound", "checkbox", this.handleInvCheckEnableDisable, this);
        //this is a stupid ass thing but *shrug*
        this.invThreshold = window.genlite.settings.add("InvThreshold.0", 0, "Inventory Threshold: <div style=\"display: contents;\" id=\"GenLiteInvThresholdOutput\"></div>", "range", this.setInvThreshold, this, undefined,
            [['min', '1'], ['max', '30'], ['step', '1'], ['value', '0']], "InvCheck.Enable");
        document.getElementById("GenLiteInvThresholdOutput").innerText = ` ${this.invThreshold}`


        this.overrideIGNVolume = window.genlite.settings.add("overrideIGNVolume.Enable", false, "Override Game Volume", "checkbox", this.handelOverrideVolumeEnableDisable, this);
        this.overrideVolume = window.genlite.settings.add("overrideVolume.0", 0, "Override Game Volume: <div style=\"display: contents;\" id=\"GenLiteOverrideVolumeOutput\"></div>", "range", this.setOverrideVolume, this, undefined,
            [['min', '1'], ['max', '100'], ['step', '1'], ['value', '0']], "overrideIGNVolume.Enable");
        document.getElementById("GenLiteOverrideVolumeOutput").innerText = ` ${this.overrideVolume}%`;


        /* create a new SFXPlayer we will swap to this if overriding 
        this is so the games normal effects play at their correct volume
        */
        this.genliteSoundListener = new THREE.AudioListener();
        this.genliteSoundListener.setMasterVolume(this.overrideVolume / 100.0) //bypas setvolume so you dont have to override it 
        this.genliteSoundListener.gain.gain.value = 0.0;
        this.genliteSFXPlayer = new SFXPlayer();
        this.genliteSFXPlayer.load();
        this.genliteSFXPlayer.play = (key, volume) => { this.overridePlay(key, volume) }; //override the default set volume
        this.playerInUse = SFX_PLAYER;
        if (this.overrideVolume)
            this.playerInUse = this.genliteSFXPlayer;

    }

    handleDoHealthCheck(state: boolean) {
        this.doHealthCheck = state;
    }

    handleInvCheckEnableDisable(state: boolean) {
        this.doInvCheck = state;
    }

    /* switch between the two players for notifcations */
    handelOverrideVolumeEnableDisable(state: boolean) {
        this.overrideIGNVolume = state;
        if (state) {
            this.playerInUse = this.genliteSFXPlayer;
        } else {
            this.playerInUse = SFX_PLAYER;
        }
    }

    /* sets volume and plays a test sound on change */
    setOverrideVolume(threshold: number) {
        this.overrideVolume = threshold;
        document.getElementById("GenLiteOverrideVolumeOutput").innerText = ` ${this.overrideVolume}%`
        this.genliteSoundListener.setMasterVolume(this.overrideVolume / 100.0)
        if (!this.playerInUse.muted)
            this.playerInUse.play('spell-failure')
    }

    setHealthThreshold(threshold: number) {
        this.healthThreshold = threshold;
        document.getElementById("GenLiteHealthThresholdOutput").innerText = ` ${this.healthThreshold}%`
    }

    setInvThreshold(threshold: number) {
        this.invThreshold = threshold;
        document.getElementById("GenLiteInvThresholdOutput").innerText = ` ${this.invThreshold}`
    }

    combatUpdate(update) {
        if (update.id != PLAYER.id)
            return;
        if ((update.hp / update.maxhp) <= (this.healthThreshold / 100) && this.doHealthCheck)
            this.playerInUse.play('spell-failure');
    }

    handleUpdatePacket(packet) {
        if (!this.doInvCheck)
            return;
        let inUse = Object.keys(INVENTORY.items).length;
        if (this.prevSlotsUsed == null) {
            this.prevSlotsUsed = inUse;
        }
        if (inUse > this.prevSlotsUsed && inUse >= this.invThreshold)
            this.playerInUse.play('inventory-full');
        this.prevSlotsUsed = inUse;

    }

    /* play override, currently absolutely no safety features but we shouldnt need any */
    overridePlay(key, volume = 1) {
        let sound = new THREE.Audio(this.genliteSoundListener);
        sound.setLoop(false);
        sound.setBuffer(this.genliteSFXPlayer.sounds[key]);
        sound.setVolume(volume);
        sound.play();
    }
}

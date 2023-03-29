import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteHealthRegenerationPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteHealthRegenerationPlugin';

    healthRegenerationInterval;

    // TODO: Host as @resource?
    healthRegenAudio = new Audio('https://furious.no/downloads/genfanad/ping.wav');
    healthBarText: HTMLElement = this.getHealthBarText();
    oldHealth = -Infinity;
    isPluginEnabled: boolean = false;

    static healthRegenerationIntervalMilliseconds = 100;

    async init() {
        document.genlite.registerPlugin(this);

    }

    async postInit() {
      document.genlite.ui.registerPlugin("Health Regen Alert", null, this.handlePluginState.bind(this));
    }

    handlePluginState(state: boolean): void {
      this.isPluginEnabled = state;

      if (state) {
        this.start();
      } else {
        this.stop();
      }
    }

    public stop() {
      clearInterval(this.healthRegenerationInterval);
    }

    public start() {
        this.healthRegenerationInterval = setInterval(() => {
            if (!this.healthBarText) {
              this.healthBarText = this.getHealthBarText();
            }

            const health = Number(this.healthBarText.innerText);

            const diff = Math.floor(health - this.oldHealth);

            if (diff === 1) {
              this.healthRegenAudio.play();
            }

            this.oldHealth = health;

        }, GenLiteHealthRegenerationPlugin.healthRegenerationIntervalMilliseconds);
    }

    getHealthBarText(): HTMLElement {
      return document.querySelector('#new_ux-hp__numbers__wrapper #new_ux-hp__number--actual') as HTMLElement;
    }
}

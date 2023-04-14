/*
    Copyright (C) 2023 Xortrox
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/
import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteHealthRegenerationPlugin extends GenLitePlugin {
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

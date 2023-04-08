/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteQuestPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteQuestPlugin';

    isPluginEnabled: boolean = true;
    pluginSettings: Settings = {
    };

    questCounterDiv: HTMLElement;
    updateTimer = 0;

    async init() {
        document.genlite.registerPlugin(this);
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Quest Counter", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    public loginOK() {
        if (this.isPluginEnabled) {
            this.createQuestCounter();
        }
    }

    public handlePluginState(state: boolean) : void {
        if (state) {
            this.createQuestCounter();
        } else {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = 0;
            }
            // Remove the quest counter
            if (this.questCounterDiv) {
                this.questCounterDiv.remove();
                this.questCounterDiv = null;
            }
        }
        this.isPluginEnabled = state;
    }

    createQuestCounter() {
        if (this.questCounterDiv) {
            this.questCounterDiv.remove();
        } else {
            this.questCounterDiv = document.createElement('div');
            this.questCounterDiv.style.fontFamily = '"Acme", "Times New Roman", Times, serif';
            this.questCounterDiv.style.color = 'var(--yellow-1)';
        }
        let wrapper = document.getElementById('new_ux-player-info-modal__quests__title__wrapper');
        wrapper.appendChild(this.questCounterDiv);
        setTimeout(this.updateQuestCounter.bind(this), 1000);
    }

    async updateQuestCounter() {
        let container = document.getElementById('new_ux-player-info-modal__quests__list__wrapper');
        let completed = 0;
        let total = 0;

        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            child.classList.forEach((cls) => {
                total++;
                switch (cls) {
                    case 'quest-complete':
                        completed++;
                        break;
                    case 'quest-new':
                        break;
                    case 'quest-inprogress':
                        break;
                    default:
                        break;
                }
            });
        }

        if (this.questCounterDiv) {
            this.questCounterDiv.innerText = completed + ' / ' + total;
        }
        this.updateTimer = window.setTimeout(this.updateQuestCounter, 2000);
    }

}

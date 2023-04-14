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

export class GenLiteTaggingPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteTaggingPlugin';
    static storageName = 'genlitePlayerTags';
    static tagClassName = 'genlite-tagging-tag';

    pluginSettings = {};

    isPluginEnabled: boolean = false;
    playerTags: Record<string, string> = {}

    async init() {
        document.genlite.registerPlugin(this);
        this.loadFromStorage();
        this.createCSS();
    }

    async postInit() {
        document.genlite.ui.registerPlugin("Player Tags", null,  this.handlePluginState.bind(this));
    }

    loginOK() {
        this.updateUI();
    }

    handlePluginState(state: boolean): void {
        this.isPluginEnabled = state;
        this.updateUI();
    }

    loadFromStorage() {
        let str = localStorage[GenLiteTaggingPlugin.storageName];
        if (str) {
            let data = JSON.parse(str);
            this.playerTags = data.tags ? data.tags : {};
        }
    }

    saveToStorage() {
        localStorage[GenLiteTaggingPlugin.storageName] = JSON.stringify({
            tags: this.playerTags,
        });
    }

    createCSS() {
        const style = document.createElement('style');
        style.innerHTML = `
            .genlite-tagging-tag {
                position: absolute !important;
                right: 1em;
                font-size: 0.75em;
                background-color: floralwhite;
                border-radius: 1em;
                background-clip: border-box !important;
                padding-left: 1em;
                padding-right: 1em;
                padding-top: 0.1em;
                padding-bottom: 0.1em;
            }
        `;
        document.head.appendChild(style);
    }

    updateUI() {
        for (let node of document.game.FRIENDS.DOM_friend_list.childNodes) {
            let elements = node.getElementsByClassName(GenLiteTaggingPlugin.tagClassName);
            let div = <HTMLElement>(
                elements.length
                ? elements[0]
                : this.createNewTagDiv(node)
            );

            let tag = this.playerTags[node.name.toLowerCase()];
            if (!this.isPluginEnabled || !tag) {
                div.style.display = 'none';
            } else {
                div.innerText = tag;
                div.style.removeProperty('display');
            }
        }
    }

    createNewTagDiv(node) {
        let div = <HTMLElement>document.createElement('div');
        div.classList.add(GenLiteTaggingPlugin.tagClassName);
        node.appendChild(div);
        return div;
    }

    editTag(player, tag) {
        this.playerTags[player.toLowerCase()] = tag;
        this.updateUI();
        this.saveToStorage();
    }

    removeTag(player) {
        this.playerTags[player.toLowerCase()] = '';
        this.updateUI();
        this.saveToStorage();
    }

    Friends_getContextOptionsFriends(list) {
        if (this.isPluginEnabled) {
            for (let node of document.game.FRIENDS.DOM_friend_list.childNodes) {
                if (node.matches(':hover')) {
                    list.push({
                        blockLeftClick: true,
                        color: 'none',
                        priority: -2,
                        object: {
                            type: 'player-ui',
                            text() {
                                return document.game.toDisplayName(node.name);
                            }
                        },
                        text: "Edit Tag",
                        action: () => {
                            this.editTag(node.name, window.prompt('enter tag'));
                        }
                    });
                }
            }
        }
    }

    Friends__populateFriends(friends) {
        this.updateUI();
    }

}

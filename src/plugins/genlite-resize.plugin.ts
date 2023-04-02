/*
    Copyright (C) 2023 snwhd
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from '../core/interfaces/plugin.interface';

export class GenLiteResizePlugin implements GenLitePlugin {
    static pluginName = 'GenLiteResizePlugin';

    isPluginEnabled: boolean = true;
    pluginSettings: Settings = {
        "Resize Camera View": {
            type: 'checkbox',
            value: false,
            stateHandler: this.handleResizeCameraViewToggle.bind(this)
        },
    };

    originalGraphicsResize: Function;
    resizeCameraView = false;
    uiOpen = false;

    async init() {
        document.genlite.registerPlugin(this);
        this.originalGraphicsResize = document.game.GRAPHICS.resize;
    }

    async postInit() {
        document.genlite.ui.registerPlugin("UI Transition", null, this.handlePluginState.bind(this), this.pluginSettings);
    }

    public handlePluginState(state: boolean) : void {
        this.isPluginEnabled = state;
        if (state) {
            // override resize method
            document.game.GRAPHICS.resize = function () {
                this.camera.resize();
                this.renderer.setSize(document.body.clientWidth, document.body.clientHeight);
            };

            // canvas resize
            if (this.resizeCameraView) {
                let style = 'calc(100% - 300px)';
                document.body.style.width = style;
                document.game.GRAPHICS.resize();
            }

            // side UI transitions
            document.body.style.transition = 'width 0.5s ease-in-out 0s';
            let inv = document.getElementById('new_ux-minimap-UI-anchor');
            if (inv) {
                if (this.uiOpen) {
                    inv.style.right = '300px';
                }
                inv.style.transition = 'right 0.5s ease-in-out 0s'
            }
        } else {
            // reset resize method
            document.game.GRAPHICS.resize = this.originalGraphicsResize;
            document.body.style.removeProperty('width'); // in case canvas was resized
            document.game.GRAPHICS.resize();

            // remove side UI transition
            let inv = document.getElementById('new_ux-minimap-UI-anchor');
            if (inv) {
                inv.style.removeProperty('right');
                inv.style.removeProperty('transition');
            }
        }
    }

    handleResizeCameraViewToggle(state: boolean) : void {
        this.resizeCameraView = state;
        if (state && this.uiOpen) {
            let style = 'calc(100% - 300px)';
            document.body.style.width = style;
            document.game.GRAPHICS.resize();
        } else if (!state && this.uiOpen) {
            document.body.style.removeProperty('width');
            document.game.GRAPHICS.resize();
        }
    }

    genlite_onSettingsOpen() {
        this.uiOpen = true;
        if (this.isPluginEnabled) {
            if (this.resizeCameraView) {
                setTimeout(function() {
                    let style = 'calc(100% - 300px)';
                    document.body.style.width = style;
                    document.game.GRAPHICS.resize();
                }, 500);
            }
            let inv = document.getElementById('new_ux-minimap-UI-anchor');
            if (inv) {
                inv.style.right = '300px';
            }
        }
    }

    genlite_onSettingsClose() {
        this.uiOpen = false;
        if (this.isPluginEnabled) {
            document.body.style.removeProperty('width');
            document.game.GRAPHICS.resize();
            let inv = document.getElementById('new_ux-minimap-UI-anchor');
            if (inv) {
                inv.style.removeProperty('right');
            }
        }
    }

}

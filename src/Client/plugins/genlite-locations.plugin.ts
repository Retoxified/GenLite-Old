/*
    Copyright (C) 2022-2023 BonesdogNardwe, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/


/*
 GenLiteLocationsPlugin
 Description: Location Labels, Coordinates, and Detailed Map
 Known Issues:
 */

import { GenLitePlugin } from '../core/interfaces/plugin.class';

export class GenLiteLocationsPlugin extends GenLitePlugin {
    static pluginName = 'GenLiteLocationsPlugin'
    private classifyPoint = require("robust-point-in-polygon") //<<---- I would like to remove library soon given locations will be vanilla soon?
    private stylesheetAdded: boolean = false;
    private locationLabels: boolean = false;
    private showCoordinates: boolean = false;//
    private compassMap: boolean = false;
    private mainLocations: object = {};//!!!
    private dungeonLocations: object = {};//!!!
    private regionLocations: object = {};//!!! any and objects need typescript type!
    private locationLabel: HTMLElement;
    private mapIframe: HTMLIFrameElement;
    private popupMap: any; //!!!
    private currentLocationLabel: string;
    private currentLocation: any;//!!!
    private currentSubLocation: string;
    private lastPosition: number[];
    private mapFocus: boolean;
    private mapZoom: number;
    private mapTranslucent: boolean = false;
    private translucentScale: number = 0.5;
    private minTranslucentScale: number = 0;
    private maxTranslucentScale: number = 1;

    pluginSettings: Settings = {
        "Enable Location Labels": {
            type: "checkbox",
            oldKey: "LocationLabels.Enable",
            value: this.locationLabels,
            stateHandler: this.handleLocationLabelsEnableDisable.bind(this),
        },
        "Enable Coordinates": {
            type: "checkbox",
            oldKey: "Coordinates.Enable",
            value: this.showCoordinates,
            stateHandler: this.handleShowCoordinatesDisable.bind(this),
        },
        "Enable Compass Map": {
            type: "checkbox",
            oldKey: "CompassMap.Enable",
            value: this.compassMap,
            stateHandler: this.handleCompassMapEnableDisable.bind(this),
            children: {
                "Translucent Scale": {
                    type: "range",
                    oldKey: "CompassMapTranslucentScale",
                    value: this.translucentScale,
                    stateHandler: this.handleCompassMapTranslucentSlider.bind(this),
                    min: 0,//GenLiteLocationsPlugin.minTranslucentScale,
                    max: 1,//GenLiteLocationsPlugin.maxTranslucentScale,
                    step: 0.05,
                }
            }
        },
    }

    private setupLocations(): void {
        this.lastPosition = [0, 0]
        this.currentLocation = [[0, 0]]
        this.currentLocationLabel = ""
        this.currentSubLocation = ""
        this.mainLocations = {
            "Town of Skal": {
                polygon: [[]],
                subLocations: {

                }
            },
            "Cent": {
                polygon: [[54, 64], [85, 58], [126, 56], [125, 128], [28, 127], [-18, 101], [-18, 91], [-1, 64], [54, 64]],
                subLocations: {
                    "Cent Anvil": [[98, 89], [100, 89], [100, 92], [98, 92], [98, 89]],
                    "Wolfgang's Sheepfold": [[100, 59], [112, 59], [112, 70], [109, 73], [101, 73], [101, 65], [100, 64], [100, 59]],
                    "Jax Butchery": [[111, 96], [115, 96], [115, 98], [111, 98]],
                    "Kordan's Armoury": [[109, 92], [111, 92], [111, 96], [109, 96]],
                    "Fern's General Store": [[97, 93], [100, 93], [100, 95], [99, 96], [97, 96], [97, 99], [95, 99], [95, 96], [97, 94]],
                    "Tutorial": [[91, 104], [97, 104], [98, 105], [99, 105], [100, 104], [103, 104], [103, 101], [120, 101], [120, 102], [121, 103], [120, 110], [120, 111], [119, 112], [120, 113], [120, 119], [118, 121], [118, 123], [116, 125], [111, 125], [110, 124], [109, 124], [109, 122], [99, 122], [96, 119], [92, 119], [92, 113], [91, 112], [91, 104]]
                }
            },
            "Zamok": {
                polygon: [[26, -13], [-5, 20], [-5, 40], [1, 47], [1, 49], [4, 51], [7, 52], [14, 59], [14, 61], [16, 62], [21, 62], [22, 61], [32, 61], [33, 62], [39, 62], [44, 56], [53, 61], [62, 54], [68, 57], [84, 55], [99, 40], [95, 7], [68, 10], [67, 0], [67, -9], [63, -13], [26, -13]],
                subLocations: {
                    "Zamok Bank": [[78, 24], [83, 24], [83, 29], [78, 29], [78, 24]],
                    "Oberon's Armour Shop": [[85, 19], [88, 19], [85, 19], [85, 23], [88, 23]],
                    "Remmy's Pottery": [[90, 23], [93, 23], [93, 26], [90, 26], [90, 23]],
                    "Zarchery's Investation": [[80, 34], [80, 37], [83, 37], [83, 34], [80, 34]],
                    "Helena's Kitchen": [[89, 36], [89, 39], [92, 39], [92, 36], [89, 36]],
                    "Tom's Tanery": [[88, 41], [88, 44], [91, 44], [91, 41], [88, 41]],
                    "Zamok Mine": [[82, 15], [81, 12], [75, 12], [72, 14], [77, 21], [82, 15]],
                    "Zamok Castle": [[42, 15], [49, 15], [52, 13], [56, 16], [62, 16], [68, 11], [75, 22], [75, 56], [68, 57], [63, 54], [54, 60], [47, 56], [42, 55], [42, 15]]
                }
            },
            "Coyn": {
                polygon: [[200, 150], [270, 160], [289, 242], [174, 235]]
            },
            "Thralltown": {
                polygon: [[]]
            },
            "Plenty": {
                //Currently some points are in the river, may need to change if/when boating because a skill
                polygon: [[137, 169], [141, 165], [165, 165], [173, 173], [173, 175], [177, 179], [179, 179], [188, 188], [198, 188], [192, 196], [180, 199], [177, 209], [173, 209], [173, 213], [178, 213], [178, 223], [160, 223], [147, 221], [147, 218], [146, 217], [146, 214], [147, 213], [147, 209], [143, 205], [139, 205], [137, 203], [132, 203], [131, 204], [122, 204], [120, 202], [120, 196], [119, 195], [119, 189], [122, 186], [122, 181], [124, 179], [134, 179], [137, 176], [137, 169]],
                //subLocations: {}
            },
            "Emerald City": {
                polygon: [[-55, 382], [-8, 382], [-8, 336], [-55, 336], [-55, 382]]
            },
            "Wicked Witches Fortress": {
                polygon: [[-185, 332], [-186, 340], [-190, 347], [-189, 367], [-179, 370], [-171, 380], [-149, 380], [-130, 377], [-129, 370], [-97, 382], [-100, 354], [-121, 337], [-162, 316], [-185, 332]]
            },
            "Skal": {
                polygon: [[-218, 269], [-136, 270], [-137, 293], [-169, 294], [-179, 302], [-220, 309], [-225, 302], [-223, 282], [-218, 269]]
            },
            "Milltown": {
                polygon: [[178, 14], [190, 14], [194, 18], [192, 38], [186, 46], [177, 46], [176, 47], [171, 47], [170, 46], [167, 46], [161, 40], [161, 35], [162, 34], [162, 29], [161, 28], [161, 21], [171, 21], [178, 14]]
            }

        }
        this.dungeonLocations = {
            "Reka Dungeon": {
                polygon: [[18, -70], [-66, -70], [-66, -23], [18, -23], [18, -70]],
                subLocations: {
                    "Reka Baby Fire Elementals": [[-2, -59], [-2, -57], [3, -57], [6, -54], [9, -54], [9, -52], [11, -50], [14, -50], [14, -61], [6, -61], [4, -59], [-2, -59]]
                }
            },
            "Tutorial Dungeon": {
                polygon: [[77, 73], [130, 73], [130, 124], [82, 125], [77, 73]],
            }
        }
        this.regionLocations = {
            "Reka Valley": [[-128, -128], [227, -128], [240, -55], [240, -51], [235, -46], [235, -38], [240, -33], [228, -21], [227, 17], [235, 34], [237, 50], [244, 57], [246, 86], [248, 109], [251, 113], [251, 130], [253, 132], [253, 144], [258, 149], [258, 151], [268, 161], [272, 161], [280, 169], [280, 178], [290, 201], [291, 224], [338, 255], [-75, 255], [-90, 244], [-98, 244], [-106, 236], [-114, 237], [-121, 227], [-121, 208], [-108, 195], [-108, 185], [-97, 174], [-97, 154], [-102, 149], [-76, 145], [-60, 127], [-48, 123], [-38, 116], [-22, 118], [-17, 109], [-6, 40], [-7, 0], [-60, -10], [-73, -34], [-76, -55], [-127, -59], [-128, -128]],
            "Kosten Ridge": [[247, -76], [295, -110], [490, -112], [509, 215], [472, 254], [342, 254], [290, 221], [247, -76]],
            "Paridot Plains": [[127, 256], [-75, 256], [-68, 263], [-77, 282], [-102, 287], [-121, 314], [-95, 383], [0, 383], [0, 511], [127, 511], [127, 256]],
            "Timberlode Threshold": [[-256, 127], [-161, 128], [-128, 149], [-103, 149], [-98, 154], [-98, 174], [-109, 185], [-109, 195], [-122, 208], [-122, 228], [-103, 383], [-256, 383], [-256, 127]]
        }
    }
    private setupUILocationLabel(): void {
        this.locationLabel = document.createElement("div")
        this.locationLabel.style.display = "none";
        this.locationLabel.style.visibility = "hidden";
        this.locationLabel.style.color = "goldenrod";
        this.locationLabel.style.fontFamily = "'Acme', 'Times New Roman', Times, serif";
        this.locationLabel.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
        this.locationLabel.classList.add("location-label")
        this.locationLabel.innerText = ""
        document.body.appendChild(this.locationLabel)
    }
    private setupUIMapIframe(): void {
        this.mapZoom = 0.55
        this.mapIframe = document.createElement("iframe")
        this.mapIframe.style.display = "none";
        this.mapIframe.style.visibility = "hidden";
        this.mapIframe.classList.add("map-iframe", "map-iframe-hidden")

        this.mapIframe.src = `https://genfamap.com/?location=true#0_0_${this.mapZoom}`
        document.body.appendChild(this.mapIframe)
    }
    async init() {
        document.genlite.registerPlugin(this);

        this.setupLocations();
        this.setupUILocationLabel();
        this.setupUIMapIframe();

        this.addStylesheet()
        //
    }
    async postInit() {
        document.genlite.ui.registerPlugin("Locations", null, this.handlePluginState.bind(this), this.pluginSettings);
    }
    handlePluginState(state: boolean): void {
        // TODO: Implement
    }
    private handleCompassMapTranslucentSlider(value) {
        this.translucentScale = value;
        this.addGlobalStylesheet(`
            .map-iframe-translucent {
                    display: block;
                    visibility: visible;
                    opacity: ${this.translucentScale};
                    pointer-events: none;
            }
        `);//Not the best way to do this.
    }
    private handleLocationLabelsEnableDisable(state: boolean): void {
        this.locationLabels = state;
        this.checkLocationLabels();
    }
    private checkLocationLabels(): void {
        if (this.locationLabels) {
            this.enableLocationLabels()
        } else if (!this.locationLabels) {
            this.disableLocationLabels()
        }
    }
    private handleShowCoordinatesDisable(state: boolean): void {
        this.showCoordinates = state
        this.checkShowCoordinates()

    }
    private checkShowCoordinates(): void {
        if (this.showCoordinates) {
            this.locationCheck()
        } else if (!this.showCoordinates) {
            this.locationCheck()
        }
    }
    private handleCompassMapEnableDisable(state: boolean): void {
        this.compassMap = state
        if (this.compassMap) {
            this.enableMapIframe()
        } else if (!this.compassMap) {
            this.disableMapIframe()
        }
        this.locationCheck()
    }
    private updateMapIframeSrc(override=false): void {
        if (!this.mapFocus && !this.mapTranslucent && !override) return
        let layer = document.game.PLAYER.location.layer.includes("world") ?
            document.game.PLAYER.location.layer.replace("world", '') : document.game.PLAYER.location.layer
        //Zoom Logic Goes here?

        this.mapIframe.src = `https://genfamap.com/${layer}?location=true#${document.game.PLAYER.character.pos2.x + .5}_${document.game.PLAYER.character.pos2.y - .5}_${this.mapZoom}`
    }
    private toggleTranslucentMap(): void {
        this.mapTranslucent = !this.mapTranslucent

        if (this.mapTranslucent) {
            this.mapIframe.classList.add("map-iframe-translucent")
            this.mapIframe.classList.remove("map-iframe-hidden")
            this.mapIframe.classList.remove("map-iframe-focus")
        } else if (!this.mapTranslucent) {
            this.mapIframe.classList.add("map-iframe-hidden")
            this.mapIframe.classList.remove("map-iframe-translucent")
            this.mapIframe.classList.remove("map-iframe-focus")
            this.mapFocus = false
        }
        this.updateMapIframeSrc()
    }
    private hideMap(): void {
        this.mapFocus = false
        this.mapTranslucent = false

        this.mapIframe.classList.add("map-iframe-hidden")
        this.mapIframe.classList.remove("map-iframe-focus")
        this.mapIframe.classList.remove("map-iframe-translucent")
    }
    private focusMap(): void {
        this.mapFocus = true
        this.mapTranslucent = false

        this.updateMapIframeSrc(true)

        this.mapIframe.classList.add("map-iframe-focus")
        this.mapIframe.classList.remove("iframe-map-hidden")
        this.mapIframe.classList.remove("map-iframe-translucent")
    }
    openMap() {
        this.updateMapIframeSrc(true)
        let layer = document.game.PLAYER.location.layer.includes("world") ?
            document.game.PLAYER.location.layer.replace("world", '') : document.game.PLAYER.location.layer

        this.popupMap = window.open(`https://genfamap.com/${layer}?location=true#${document.game.PLAYER.character.pos2.x}_${document.game.PLAYER.character.pos2.y}_0.67`, "genfanad-map", 'width=800,height=600')
    }
    private setLocationLabelUnknown(): void {
        this.showCoordinates ?
            this.locationLabel.innerText = `(${document.game.GAME.world.x},${document.game.GAME.world.y})` :
            this.locationLabel.innerText = ``
    }
    private setLocationLabel(value: string): void {
        this.showCoordinates ?
            this.locationLabel.innerText = `${value} (${document.game.GAME.world.x},${document.game.GAME.world.y})` :
            this.locationLabel.innerText = `${value}`
    }
    private checkSubLocation(subLocations: object, currentPosition: number[]): boolean {
        for (const subLocation in subLocations) {
            if (this.classifyPoint(subLocations[subLocation], currentPosition) != 1) {
                this.setLocationLabel(subLocation)
                this.currentLocation = subLocations[subLocation]
                this.currentLocationLabel = subLocation
                this.currentSubLocation = subLocations[subLocation]
                //TODO fix the nonsense going on here ^^ Decide the best way to store the current label and location as well as sub location
                return true
            }
        }
    }/////////
    private checkRegionLocations(regionLocations: object, currentPosition: number[]): boolean {
        //hmmmm ^^^^ This is duplicate of above; but also not sure if regions should be complex polygons perhaps only squares/cubes
        for (const regionLocation in regionLocations) {
            if (this.classifyPoint(regionLocations[regionLocation], currentPosition) != 1) {
                this.setLocationLabel(regionLocation)
                this.currentLocation = regionLocations[regionLocation]
                this.currentLocationLabel = regionLocation
                this.currentSubLocation = regionLocations[regionLocation]
                //TODO fix the nonsense going on here ^^ Decide the best way to store the current label and location as well as sub location
                return true
            }
        }

    }
    private checkLocations(locationsToCheck: object, currentPosition: number[]): boolean {
        for (const location in locationsToCheck) {
            if (this.classifyPointOrPolygon(locationsToCheck[location], currentPosition) != 1) {
                this.currentLocation = locationsToCheck[location].polygon
                this.currentLocationLabel = location

                if (locationsToCheck[location].subLocations !== undefined) {
                    if (this.checkSubLocation(locationsToCheck[location].subLocations, currentPosition))
                        return true
                }

                this.setLocationLabel(location)
                return true
            }
        }
        return this.checkRegionLocations(this.regionLocations, currentPosition)
    }
    private classifyPointOrPolygon(pointOrPolygon: any, position: number[]): number { //-1, 0, 1
        return this.classifyPoint((pointOrPolygon.polygon !== undefined) ? pointOrPolygon.polygon : pointOrPolygon, position)
    }
    private startLocationCheck(currentPosition: number[], lastPosition: number[]): void {
        if (currentPosition != lastPosition) {

            //TODO re-add check previous location here and skip the switch if still in region.
            let found: boolean
            switch (document.game.PLAYER.location.layer) {
                case "dungeon":
                    found = this.checkLocations(this.dungeonLocations, currentPosition)
                    break;
                case "fae":
                    this.setLocationLabel("Fae")//
                    break;
                case "world1":
                case "world2":
                case "world3":
                default:
                    found = this.checkLocations(this.mainLocations, currentPosition)
                    break;

            }
            if (!found) {
                this.setLocationLabelUnknown()
            }
        }
        this.lastPosition = currentPosition
    }

    private locationCheck() {
        let currentPosition: number[] = [document.game.PLAYER.character.pos2.x, document.game.PLAYER.character.pos2.y]
        this.startLocationCheck(currentPosition, this.lastPosition)

        this.updateMapIframeSrc()
    }
    animationDetector(animation) {
        this.locationCheck()
    }
    private addGlobalStylesheet(css) {
        let head, style

        head = document.head || document.getElementsByTagName('head')[0]

        style = document.createElement('style')
        style.type = 'text/css'
        //style.innerHTML = css.replace(/;/g, ' ! important;')

        head.appendChild(style)

        if (style.styleSheet) {
            style.styleSheet.cssText = css // This is required for IE8 and below.
        } else {
            style.appendChild(document.createTextNode(css))
        }
    }
    private addStylesheet() {
        this.addGlobalStylesheet(`
            .gen-slider {
            
            }
            .location-label { 
                font-size: 2em;
                color: yellow;
                position: absolute;
                left: 50vw;
                top: 1em;
                transform: translate(-50%, -50%);
                display: none;
                visibility: hidden;
                pointer-events: none;
            }
            .map-iframe {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50vw;
                min-height: 75vh;
                pointer-events: auto;
                z-index: 1;
            }
            .map-iframe-translucent {
                display: block;
                visibility: visible;
                opacity: ${this.translucentScale};
                pointer-events: none;
            }
            .map-iframe-hidden {
                display: none;
                visibility: hidden;
                opacity: 0.0;
                pointer-events: none;
            }
            .map-iframe-focus {
                display: block;
                visibility: visible;
                opacity: 1.0;
                pointer-events: auto;
            }
            .map-compass-outline {
                border-radius: 50%;
                border: 2px solid #DAA520;
            }
        `)

        //let sheet = document.styleSheets[0]
        //this.styleRuleIndex = sheet.insertRule("", sheet.cssRules.length)
        this.stylesheetAdded = true
    }
    loginOK() {
        if (this.locationLabels) {
            this.enableLocationLabels()
            this.locationCheck()
        }
        if (!this.stylesheetAdded) {
            this.addStylesheet() //Would do in init but not working properly when used there...
        }
        if (this.compassMap)
            this.enableMapIframe()
    }
    Network_logoutOK() {
        this.disableLocationLabels()
        this.disableMapIframe()
    }

    private minimapCompassClick = () => {
        if (this.mapFocus) {
            this.hideMap()
        } else if (!this.mapFocus) {
            this.focusMap()
        }
    }

    private minimapCompassRightClick = (event) => {
        event.preventDefault()
        this.toggleTranslucentMap()
    }
    private enableMapIframe() {
        this.mapIframe.style.display = "block";
        this.mapIframe.style.visibility = "visible"; //Not a fan of doing it like this; need to determine better way to reolve issue
        this.hideMap()

        let minimapCompass = document.getElementById("new_ux-minimap-compass")
        minimapCompass.addEventListener("click", this.minimapCompassClick)
        minimapCompass.addEventListener("mouseover", this.minimapCompassMouseOver)
        minimapCompass.addEventListener("mouseout", this.minimapCompassMouseOut)
        minimapCompass.addEventListener('contextmenu', this.minimapCompassRightClick)
    }
    private disableMapIframe() {
        this.hideMap()

        let minimapCompass = document.getElementById("new_ux-minimap-compass")
        minimapCompass.removeEventListener("click", this.minimapCompassClick)
        minimapCompass.removeEventListener("mouseover", this.minimapCompassMouseOver)
        minimapCompass.removeEventListener("mouseout", this.minimapCompassMouseOut)
        minimapCompass.removeEventListener("contextmenu", this.minimapCompassRightClick)
    }
    private minimapCompassMouseOver = () => {
        let minimapCompass = document.getElementById("new_ux-minimap-compass")
        minimapCompass.classList.add("map-compass-outline")
    }
    private minimapCompassMouseOut = () => {
        let minimapCompass = document.getElementById("new_ux-minimap-compass")
        minimapCompass.classList.remove("map-compass-outline")
    }
    private disableLocationLabels() {
        this.locationLabel.style.display = "none"
        this.locationLabel.style.visibility = "hidden"
        Object.defineProperty(document.game.PLAYER.character, "movement_animation", {
            set: (animation) => { }
        })
    }
    private enableLocationLabels() {
        this.locationLabel.style.display = "block"
        this.locationLabel.style.visibility = "visible"
        Object.defineProperty(document.game.PLAYER.character, "movement_animation", {
            set: (animation) => {
                this.animationDetector(animation)
            }
        })
    }

    /* hook_PlayerMove(layer, x, y, force) {
         console.log("I moved!")
         //This hook is not being used, right now we are extending onto the animation function which runs less frequently
         // than this hook which runs every cycle. (However the animation function runs roughly 9 times when a player
         // is moving as well as during attack animations..)
     }*/
}

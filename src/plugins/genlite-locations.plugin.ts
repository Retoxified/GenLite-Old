/*
 GenliteLocationsPlugin
 Description: The goal of this plugin is to have labels for all locations in the map.
 Known Issues: Some code is redundant, and iv written out a few known to-do's sporatically through the code;
  it is not currently optimal but should be usable for now. Some polygons when made from clicking on genfamap
  and generating the array in the browser have not worked 100% correctly either. Not sure if this is the polygon
  library messing up or if the points are invalid. When Manually inputing the points this issue does not appear
  to happen.
 */
export class GenLiteLocationsPlugin {
    static pluginName = 'GenLiteLocationsPlugin'
    private classifyPoint = require("robust-point-in-polygon") //Not a fan of where this is...
    async init() {
        window.genlite.registerModule(this)
        this.isPluginEnabled = window.genlite.settings.add("LocationLabels.Enable", true, "Location Labels", "checkbox", this.handlePluginEnableDisable, this)
        //window.genlite.installHook(WorldManager.prototype, 'playerMove',  this.hook_PlayerMove, this);
        // May use this instead of animation override however this function runs much more often than needed
    }
    mainLocations: object //!!!
    dungeonLocations: object //!!!
    isPluginEnabled: boolean
    locationLabel: HTMLElement
    mapIframe: HTMLIFrameElement //TODO
    mapButton: HTMLButtonElement
    currentLocationLabel: string
    currentLocation: any//!!!
    currentSubLocation: string
    lastPosition: number[]
    popupMap: any //!!!
    constructor() {
        this.setupLocations()
        this.setupLocationLabel()
        this.setupMap()
    }
    private handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        this.checkIsPluginEnabled()
    }
    private setupLocations() {
        this.lastPosition = [0,0]
        this.currentLocation = [[0,0]]
        this.currentLocationLabel = ""
        this.currentSubLocation = ""
        this.mainLocations = {
            "Town of Skal": {
                polygon: [[]],
                subLocations: {

                }
            },
            "Cent": {
                polygon: [],
                subLocations: {
                    "Cent Anvil": [[98,89],[100,89],[100,92],[98,92],[98,89]],
                    "Wolfgang's Sheepfold": [[100,59],[112,59],[112,70],[109,73],[101,73],[101,65],[100,64],[100,59]]
                }
            },
            "Zamok": {
                polygon: [[26,-13],[-5,20],[-5,40],[1,47],[1,49],[4,51],[7,52],[14,59],[14,61],[16,62],[21,62],[22,61],[32,61],[33,62],[39,62],[44,56],[53,61],[62,54],[68,57],[84,55],[99,40],[95,7],[68,10],[67,0],[67,-9],[63,-13],[26,-13]],
                subLocations: {
                    "Zamok Bank": [[78,24],[83,24],[83,29],[78,29],[78,24]],
                    "Oberon's Armour Shop": [[85,19],[88,19],[85,19],[85,23],[88,23]],
                    "Remmy's Pottery": [[90,23],[93,23],[93,26],[90,26],[90,23]],
                    "Zarchery's Investation": [[80,34],[80,37],[83,37],[83,34],[80,34]],
                    "Helena's Kitchen": [[89,36],[89,39],[92,39],[92,36],[89,36]],
                    "Tom's Tanery": [[88,41],[88,44],[91,44],[91,41],[88,41]],
                    "Zamok Mine": [[82,15],[81,12],[75,12],[72,14],[77,21],[82,15]],
                    "Zamok Castle": [[42,15],[49,15],[52,13],[56,16],[62,16],[68,11],[75,22],[75,56],[68,57],[63,54],[54,60],[47,56],[42,55],[42,15]]
                }
            },
            "Reka Valley": {
                polygon: []
            },
            "Coyn": {
                polygon: [[200,150],[270,160],[289,242],[174,235]]
            },
            "Kosten Ridge": {
                polygon: [[247,-76],[295,-110],[490,-112],[509,215],[472,254],[342,254],[290,221],[247,-76]],
                subLocations: {
                    //"The Progenitor's Castle": []
                }
            },
            "Paridot Plains": {

            },
            "Thralltown": {
                polygon: [[]]
            },
            "Plenty": {
                //Currently some points are in the river, may need to change if/when boating because a skill
                polygon: [[137,169],[141,165],[165,165],[173,173],[173,175],[177,179],[179,179],[188,188],[198,188],[192,196],[180,199],[177,209],[173,209],[173,213],[178,213],[178,223],[160,223],[147,221],[147,218],[146,217],[146,214],[147,213],[147,209],[143,205],[139,205],[137,203],[132,203],[131,204],[122,204],[120,202],[120,196],[119,195],[119,189],[122,186],[122,181],[124,179],[134,179],[137,176],[137,169]],
                //subLocations: {} //TODO
            },
            "Emerald City": {
                polygon: [[-55,382],[-8,382],[-8,336],[-55,336],[-55,382]]
            },
            "Tutorial":{
                //TODO
                //polygon: [[91,104],[91,112],[92,113],[92,117],[]]
            },
            "Dark Forest": {
                polygon: [[-185,332],[-186,340],[-190,347],[-189,367],[-179,370],[-171,380],[-149,380],[-130,377],[-129,370],[-97,382],[-100,354],[-121,337],[-162,316],[-185,332]]
            },
            "Skal": {
                polygon: []
            },
            "Milltown": {
                polygon: []
            }

        }
        this.dungeonLocations = {
            "Reka Dungeon": {
                polygon: [[18, -70], [-66, -70], [-66, -23], [18, -23], [18, -70]],
                subLocations: {
                    "Reka Baby Fire Elementals": [[-2, -59], [-2, -57], [3, -57], [6, -54], [9, -54], [9, -52], [11, -50], [14, -50], [14, -61], [6, -61], [4, -59], [-2, -59]]
                }
            }
        }
    }
    private setupLocationLabel() {
        this.locationLabel = document.createElement("div")
        this.locationLabel.className = "location_label"
        this.locationLabel.innerText = ""
        this.locationLabel.style.cssText = `
            font-size: 2em;
            color: yellow;
            position: absolute;
            left: 50vw;
            top: 1em;
            transform: translate(-50%, -50%);
            display: none;
            visibility: hidden;
            pointer-events: none;
        `
        document.body.appendChild(this.locationLabel)
    }

    private setupMap() {
        this.mapButton = document.createElement("button")
        this.mapButton.className = "map-button"
        this.mapButton.innerText = "Open Map"
        this.mapButton.style.cssText = `
            position: absolute;
            bottom: 1px;
            right: 0;  
            display: none;
            visibility: hidden;          
        `
        document.body.appendChild( this.mapButton )

        /*
        this.mapIframe = document.createElement("iframe")
        this.mapIframe.className = "map-iframe" //TODO perhaps use IDs instead of classes
        this.mapIframe.style.cssText = `
            position: absolute;
            top: 50vh;
            left: 50vw;
            transform: translate(-50%, -50%);
            width: 700px;
            height: 700px;
            display: none;
            visibility: hidden;
        `
        document.body.appendChild( this.mapIframe  )

         */
    }
    openMap() {
        let layer = PLAYER.location.layer.includes("world") ?
            PLAYER.location.layer.replace("world", '') : PLAYER.location.layer
        //bleh this logic needs to be expanded on to work with heights as well as layer... just plopping it here for now might break though

        this.popupMap = window.open(`https://genfamap.com/?location=true${ layer }#${PLAYER.character.pos2.x}_${PLAYER.character.pos2.y}_0.67`, "genfanad-map", 'width=800,height=600')
        //TODO switch to using iframe instead
        // may also consider storing map data
        // in the modified client/js bundle
    }
    closeMap() {
        //TODO
    }
    private setLocationLabelUnknown() {
        this.locationLabel.innerText = `(${GAME.world.x},${GAME.world.y})`

    }
    private setLocationLabel( value: string ) {
        this.locationLabel.innerText = `${value} (${GAME.world.x},${GAME.world.y})`
    }
    private checkSubLocation( subLocations:object , currentPosition:number[] ): boolean {
        for (const subLocation in subLocations) {
            if( this.classifyPoint(subLocations[subLocation], currentPosition) != 1) {
                this.setLocationLabel( subLocation )
                this.currentLocation = subLocations[subLocation]
                this.currentLocationLabel = subLocation
                this.currentSubLocation = subLocations[subLocation]
                //TODO fix the nonsense going on here ^^ Decide the best way to store the current label and location as well as sub location
                return true
            }
        }
    }
    private checkLocations( locationsToCheck:object , currentPosition:number[] ): boolean  {
        for (const location in locationsToCheck) {
            if( this.classifyPointOrPolygon( locationsToCheck[location], currentPosition) != 1 ) {
                this.currentLocation = locationsToCheck[location].polygon
                this.currentLocationLabel = location

                if( locationsToCheck[location].subLocations !== undefined ) {
                    if ( this.checkSubLocation( locationsToCheck[location].subLocations, currentPosition ) )
                        return true
                }

                this.setLocationLabel( location )
                return true
            }
        }
        return false
    }
    classifyPointOrPolygon( pointOrPolygon, position ) {
        return this.classifyPoint( (pointOrPolygon.polygon !== undefined) ? pointOrPolygon.polygon : pointOrPolygon, position )
    }
    startLocationCheck(currentPosition, lastPosition ) {
        if( currentPosition != lastPosition ) {

            //TODO re-add check previous location here and skip the switch if still in region.
            let found: boolean
            switch ( PLAYER.location.layer ) { //TODO possible remove the switch or combine with the height property in some way to handle all levels/floors etc...
                case "dungeon":
                    found = this.checkLocations( this.dungeonLocations , currentPosition )
                    break;
                default:
                    found = this.checkLocations( this.mainLocations, currentPosition )
                    break;

            }
            if(!found) {
                this.setLocationLabelUnknown()
            }
        }
        this.lastPosition = currentPosition
    }
    animationDetector( animation ) {
        let currentPosition:number[] = [ PLAYER.character.pos2.x, PLAYER.character.pos2.y ]
        this.startLocationCheck( currentPosition, this.lastPosition )
    }
    checkIsPluginEnabled() {
        if(this.isPluginEnabled) {
            this.enableLocationLabels()
            this.enableMapButton()
        } else {
            this.disableLocationLabels()
            this.disableMapButton()
        }
    }
    loginOK() {
        if(!this.isPluginEnabled) return;
        this.enableLocationLabels()
        this.enableMapButton()
    }
    logoutOK() {
        if(!this.isPluginEnabled) return;
        this.disableLocationLabels()
        this.disableMapButton()
    }
    private enableMapButton() {
        this.mapButton.addEventListener("click", this.openMap )
        this.mapButton.style.cssText = `
            position: absolute;
            bottom: 1px;
            right: 0;  
            font-size: .75em;
            background-color: brown;
            color: yellow;
            display: block;
            visibility: visible;          
        `
    }
    private disableMapButton() {
        this.mapButton.removeEventListener( "click", this.openMap )
        this.mapButton.style.cssText = `
            display: none;
            visibility: hidden;
        `
    }
    private disableLocationLabels() {
        this.locationLabel.style.display = "none"
        this.locationLabel.style.visibility = "hidden"
        Object.defineProperty(PLAYER.character, "movement_animation", {
            set: ( animation ) => {}
        } )
    }
    private enableLocationLabels() {
        this.locationLabel.style.display = "block"
        this.locationLabel.style.visibility = "visible"
        Object.defineProperty(PLAYER.character, "movement_animation", {
            set: ( animation ) => {
                this.animationDetector( animation )
            }
        } )
    }

    /* hook_PlayerMove(layer, x, y, force) {
         console.log("I moved!")
         //This hook is not being used, right now we are extending onto the animation function which runs less frequently
         // than this hook which runs every cycle. (However the animation function runs roughly 9 times when a player
         // is moving as well as during attack animations..)
     }*/
}
export class GenLiteHitRecorder {
    static pluginName = 'GenLiteHitRecorder';

    curEnemy;
    statsList;
    playerHitInfo;
    enemyHitInfo;
    consecutiveZero;
    consecutiveNonZero;
    maxZero;
    maxNonZero;
    curDpsAcc;
    cumDpsAcc;

    dpsOverlay: HTMLElement;
    dpsOverlayContainer: HTMLElement;
    dpsUiUpdateInterval;
    isUIinit: boolean;

    isPluginEnabled: boolean = false;

    constructor() {
        this.curEnemy = null;
        this.statsList = {
            aim: 0,
            power: 0,
            armour: 0,
            attack: 0,
            strength: 0,
            ranged: 0,
            defense: 0
        }
        this.playerHitInfo = { //this needs to be moved to an interface once i figure out how TS interfaces work
            hitList: {},
            totDam: 0,
            consecutiveZero: 0,
            consecutiveNonZero: 0,
            maxZero: 0,
            maxNonZero: 0,
            totalZero: 0,
            totalNonZero: 0,
            totalHits: 0,
            hitRate: 0,
            avgDamage: 0,
            avgNonZero: 0,
            stdDeviation: 0,
            ctlStdDeviation: 0
        };

        this.enemyHitInfo = {};

        this.curDpsAcc = {
            timeStart: 0,
            doUpdate: 1, //1 update contiiously; -1 do one more update; 0 stop updating - Yay, trinary logic
            totDam: 0
        };
        this.cumDpsAcc = {
            timeStart: 0,
            totDam: 0
        };

        this.isUIinit = false;
        this.dpsOverlayContainer = <HTMLElement>document.createElement("div");
        this.dpsOverlay = <HTMLElement>document.createElement("div");
    }

    async init() {
        window.genlite.registerModule(this);
        this.enemyHitInfo = structuredClone(this.playerHitInfo);
        this.isPluginEnabled = window.genlite.settings.add("HitRecorder.Enable", true, "Hit Recorder", "checkbox", this.handlePluginEnableDisable, this);
        this.dpsOverlayContainer.appendChild(this.dpsOverlay);
    }

    /* toggles plugin stat and either inits or shuts down plugin if needed */
    handlePluginEnableDisable(state: boolean) {
        this.isPluginEnabled = state;
        if (state) {
            if (!this.isUIinit)
                this.initDpsElements();
            if (this.dpsUiUpdateInterval === undefined)
                this.dpsUiUpdateInterval = setInterval(() => { this.updateDpsUI() }, 100);
            this.dpsOverlayContainer.style.visibility = "visible";
        } else {
            this.dpsOverlayContainer.style.visibility = "hidden";
            this.dpsOverlay.style.visibility = "hidden";
            clearInterval(this.dpsUiUpdateInterval);
            this.dpsUiUpdateInterval = undefined;
        }
    }

    /* filters network packets for damage data from the player */
    handle(verb, payload) {
        if (this.isPluginEnabled === false) {
            return;
        }
        /* look for start of combat set the curEnemy and record data */
        if (verb == "spawnObject" && payload.type == "combat" &&
            (payload.participant1 == PLAYER.id || payload.participant2 == PLAYER.id)) {
            let enemy;
            if (GAME.combats[payload.id].left.id != PLAYER.id) {
                enemy = GAME.combats[payload.id].left;
            } else {
                enemy = GAME.combats[payload.id].right;
            }
            let enemyid = this.curEnemy ? this.curEnemy.id : 0;
            if (enemyid != enemy.id) { //if new enemy reset otherwise keep the same dps tracker
                this.curDpsAcc.timeStart = Date.now();
                this.curDpsAcc.totDam = 0;
                this.curDpsAcc.doUpdate = 1;
                if (this.cumDpsAcc.timeStart == 0)
                    this.cumDpsAcc.timeStart = this.curDpsAcc.timeStart;
            }
            this.curEnemy = enemy;
        }

        if (verb == "projectile" && payload.source == PLAYER.id) {
            let enemyid = this.curEnemy ? this.curEnemy.id : 0;
            /* if we switch enemys reset the dps counter for the currently enemy */
            if (enemyid != payload.target) {
                this.curDpsAcc.timeStart = Date.now();
                this.curDpsAcc.totDam = 0;
                this.curDpsAcc.doUpdate = 1;
                if (this.cumDpsAcc.timeStart == 0)
                    this.cumDpsAcc.timeStart = this.curDpsAcc.timeStart;
            }
            this.curEnemy = GAME.npcs[payload.target];
            this.recordDamage(this.playerHitInfo, payload.damage);
            this.curDpsAcc.totDam += payload.damage;
            this.cumDpsAcc.totDam += payload.damage;
        }

        if (verb == "damage" && this.curEnemy != undefined && payload.id == this.curEnemy.id && payload.style == "melee") {
            this.recordDamage(this.playerHitInfo, payload.amount);
            this.curDpsAcc.totDam += payload.amount;
            if (this.cumDpsAcc.timeStart != 0) //in case user resets dps mid combat for whatever reason
                this.cumDpsAcc.totDam += payload.amount;
        } else if (verb == "damage" && this.curEnemy != undefined && payload.id == PLAYER.id) {
            this.recordDamage(this.enemyHitInfo, payload.amount);
        }

        if (verb == "removeObject" && this.curEnemy && payload.id == this.curEnemy.id) {
            this.curDpsAcc.doUpdate = -1; //make sure the ui is updated with the last hit
        }


        if (verb == "combatUI") {
            if (PLAYER_INFO !== undefined) {
                this.statsList.attack = PLAYER_INFO.skills.attack.level;
                this.statsList.strength = PLAYER_INFO.skills.strength.level;
                this.statsList.ranged = PLAYER_INFO.skills.ranged.level;
                this.statsList.defense = PLAYER_INFO.skills.defense.level;
            }
            this.statsList.aim = payload.equipment.stats.aim ?? payload.equipment.stats.ranged_aim;
            this.statsList.power = payload.equipment.stats.power ?? payload.equipment.stats.ranged_power;
            this.statsList.armour = payload.equipment.stats.armour;
            switch (payload.stance) {
                case "controlled":
                    this.statsList.attack += 1;
                    this.statsList.strength += 1;
                    this.statsList.defense += 1;
                    break;
                case "accurate":
                    this.statsList.attack += 3;
                    break;
                case "aggressive":
                    this.statsList.strength += 3;
                    break;
                case "defensive":
                    this.statsList.defense += 3;
                    break;
                case "ranged_offensive":
                    this.statsList.ranged += 3;
                    break;
                case "ranged_defensive":
                    this.statsList.ranged += 2;
                    this.statsList.defense += 1;
                    break;
            }
        }
    }

    /* init stats and the dpeElement */
    initializeUI() {
        if (!this.isPluginEnabled) {
            return;
        }
        this.statsList.attack = PLAYER_INFO.skills.attack.level;
        this.statsList.strength = PLAYER_INFO.skills.strength.level;
        this.statsList.ranged = PLAYER_INFO.skills.ranged.level;

        this.initDpsElements();
    }

    /* record the damage and call nerd funcs */
    recordDamage(hitInfo, damage) {
        if (damage == 0) {
            if (hitInfo.consecutiveNonZero > hitInfo.maxNonZero) {
                hitInfo.maxNonZero = hitInfo.consecutiveNonZero;
            }
            hitInfo.consecutiveNonZero = 0;
            hitInfo.consecutiveZero++;
            hitInfo.totalZero++;
        } else {
            if (hitInfo.consecutiveZero > hitInfo.maxZero) {
                hitInfo.maxZero = hitInfo.consecutiveZero;
            }
            hitInfo.consecutiveZero = 0;
            hitInfo.consecutiveNonZero++;
            hitInfo.totalNonZero++;
        }
        if (hitInfo.hitList[damage] === undefined) {
            hitInfo.hitList[damage] = 0;
        }
        hitInfo.totDam += damage;
        hitInfo.hitList[damage]++;
        hitInfo.totalHits++;
        hitInfo.hitRate = hitInfo.totalNonZero / hitInfo.totalHits
        this.calcAvgDamage(hitInfo);
        this.calcAvgNonZero(hitInfo);
        this.calcStdDeviation(hitInfo);
        this.calcCtlStdDeviation(hitInfo);
    }

    /* nerd functions because 2pi */
    calcAvgDamage(hitInfo) {
        hitInfo.avgDamage = hitInfo.totDam / hitInfo.totalHits;
    }

    calcAvgNonZero(hitInfo) {
        hitInfo.avgNonZero = hitInfo.avgDamage / hitInfo.hitRate;
    }

    calcStdDeviation(hitInfo) {
        let tot = 0;
        for (let hit in hitInfo.hitList)
            tot += hitInfo.hitList[hit] * Math.pow(parseInt(hit) - hitInfo.avgNonZero, 2);
        hitInfo.stdDeviation = Math.sqrt(tot / hitInfo.totalNonZero);
    }

    calcCtlStdDeviation(hitInfo) {
        hitInfo.ctlStdDeviation = hitInfo.stdDeviation / Math.sqrt(hitInfo.totalNonZero);
    }

    /* resets */
    resetHitInfo(hitInfo) {
        Object.assign(hitInfo, {
            hitList: {},
            totDam: 0,
            consecutiveZero: 0,
            consecutiveNonZero: 0,
            maxZero: 0,
            maxNonZero: 0,
            totalZero: 0,
            totalNonZero: 0,
            totalHits: 0,
            hitRate: 0,
            avgDamage: 0,
            avgNonZero: 0,
            stdDeviation: 0,
            ctlStdDeviation: 0
        });
    }

    resetPlayerHitInfo() {
        this.resetHitInfo(this.playerHitInfo);
    }

    resetEnemyHitInto() {
        this.resetHitInfo(this.enemyHitInfo);
    }

    resetAll() {
        this.resetPlayerHitInfo();
        this.resetEnemyHitInto();
    }

    /* doing html and css soley though JS sucks */
    initDpsElements() {
        //setup container;
        let style = this.dpsOverlayContainer.style;
        style.setProperty("--left", "1.3");
        style.setProperty("--top", "0.8");
        style.left = "calc( var(--left) * var(--profile-pic-height) * var(--hud-ui-zoom-factor) )";
        style.top = "calc( var(--top) * var(--profile-pic-height) * var(--hud-ui-zoom-factor) )";

        //setup overlay
        style = this.dpsOverlay.style;
        this.dpsOverlay.classList.add("new_ux-level-1");
        this.dpsOverlay.classList.add("new_ux-color-ui");
        this.dpsOverlay.id = "GenliteDpsOverlay";
        style.top = "23px";
        style.setProperty("--width", "1.3");
        style.setProperty("--height", "0.6");
        style.width = "calc( var(--width) * var(--profile-pic-height) * var(--hud-ui-zoom-factor) )";
        style.height = "calc( var(--height) * var(--profile-pic-height) * var(--hud-ui-zoom-factor) )";
        style.backgroundColor = "#331101";
        style.backgroundSize = "cover";
        style.display = "flex";
        style.flexDirection = "column";
        style.justifyContent = "space-evenly";
        style.borderRadius = "20px"
        style.visibility = "hidden";
        this.dpsOverlay.onclick = (event) => { this.resetCumDps(event) };

        //setup the divs for cur and cum dps
        for (let i = 0; i < 2; i++) {
            let div = document.createElement("div");
            div.id = `GenliteDpsText${i}`;
            div.style.paddingLeft = "5%";
            div.style.paddingRight = "5%";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.color = "#DAA520";
            div.style.position = "relative";
            for (let k = 0; k < 2; k++) {
                let span = document.createElement("span");
                span.style.position = "relative";
                span.style.fontSize = "smaller";
                span.style.fontFamily = "ui-monospaced";
                span.classList.add("GenliteDpsText");
                span.innerHTML = "Samual is a nerd";
                div.appendChild(span);
            }
            this.dpsOverlay.appendChild(div);
        }

        //close button
        let dpsClose = document.createElement("div");
        style = dpsClose.style;
        dpsClose.innerHTML = "dps";
        style.width = "40px";
        style.fontSize = "70%";
        style.backgroundColor = "#5D2309"
        style.backgroundSize = "cover";
        style.color = "white";
        style.fontFamily = "ui-monospaced";
        style.justifyContent = "center";
        style.display = "flex";
        style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
        style.borderRadius = "7px";
        dpsClose.onclick = (event) => { this.toggleDpsOverlay() };
        this.dpsOverlayContainer.insertBefore(dpsClose, this.dpsOverlay);

        //append
        let playerhud = document.getElementById("new_ux-player-hud-anchor");
        playerhud.appendChild(this.dpsOverlayContainer);
        this.dpsUiUpdateInterval = setInterval(() => { this.updateDpsUI() }, 100);
        this.isUIinit = true;
    }

    toggleDpsOverlay() {
        if (this.dpsOverlay.style.visibility == "hidden") {
            this.dpsOverlay.style.visibility = "visible";
        } else {
            this.dpsOverlay.style.visibility = "hidden";
        }
    }

    updateDpsUI() {
        let curDpsUi = this.dpsOverlay.children[0];
        let cumDpsUi = this.dpsOverlay.children[1];
        let curTime = Date.now();
        let curDps = Math.round((this.curDpsAcc.totDam / ((curTime - this.curDpsAcc.timeStart) / 1000)) * 100) / 100;
        let cumDps = Math.round((this.cumDpsAcc.totDam / ((curTime - this.cumDpsAcc.timeStart) / 1000)) * 100) / 100;
        //my favourite programing structure
        switch (this.curDpsAcc.doUpdate) {
            case -1:
                this.curDpsAcc.doUpdate = 0
            case 1:
                curDpsUi.children[0].innerHTML = "Current DPS:";
                curDpsUi.children[1].innerHTML = curDps.toLocaleString("en-US");
                break;
        }
        cumDpsUi.children[0].innerHTML = "Cumulative DPS:";
        cumDpsUi.children[1].innerHTML = cumDps.toLocaleString("en-US");
    }

    resetCumDps(event) {
        if (event.shiftKey) {
            this.cumDpsAcc = {
                timeStart: 0,
                totDam: 0
            };
        }
    }

}
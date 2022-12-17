// ==UserScript==
// @name         GenLite
// @namespace    GenLite
// @version      0.1.2
// @description  try to take over the world!
// @author       TwistedFate#4053, Xortrox#0001, Puls3
// @match        https://play.genfanad.com/play/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genfanad.com
// @grant        none
// ==/UserScript==

import { GenLite } from "./core/GenLite Base Module.user";
import { GenLiteCameraPlugin } from "./plugins/GenLite Camera Unlock.user";
import { GenliteDropRecorder } from "./plugins/GenLite Drop Recorder.user";
import { GenLiteItemHighlight } from "./plugins/GenLite Item Highlight.user";
import { GenLiteNotificationPlugin } from "./plugins/GenLite Notification Module.user";
import { GenLiteNPCHighlight } from "./plugins/GenLite NPC Highlighter.user";
import { GenLiteRecipeRecorder } from "./plugins/GenLite Recipe Recorder.user";
import { GenLiteWikiDataCollection } from "./plugins/GenLite Wiki Datacollection.user";

(async function load() {
    const genlite = new GenLite();
    genlite.init();
    window.genlite = genlite;

    // TODO: genlite.addPlugin();
    window.genliteCamera = new GenLiteCameraPlugin();

    // TODO: await window.genlite
    let gameLoadTimer = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteCamera.init();
                clearInterval(gameLoadTimer);
            }
        } catch (e) {
        }
    }, 1000);

    // TODO: genlite.addPlugin();
    window.GenliteDropRecorder = new GenliteDropRecorder();

    // TODO: await window.genlite
    let gameLoadTimer2 = setInterval(function() {
        try {
            if (window.genlite !== undefined) {
                window.GenliteDropRecorder.init();
                clearInterval(gameLoadTimer2);
            }
        } catch (e) {}
    }, 1000);

    // TODO: genlite.addPlugin();
    window.genliteItemHighlight = new GenLiteItemHighlight();

    // TODO: await window.genlite
    let gameLoadTimer3 = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteItemHighlight.init();
                clearInterval(gameLoadTimer3);
            }
        } catch (e) {
        }
    }, 1000);

    window.genliteNotification = new GenLiteNotificationPlugin();
    await window.genliteNotification.init();

    window.genliteNPCHighlight = new GenLiteNPCHighlight();

    let gameLoadTimer4 = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteNPCHighlight.init();
                clearInterval(gameLoadTimer4);
            }
        } catch (e) {
        }
    }, 1000);

    window.GenLiteRecipeRecorder = new GenLiteRecipeRecorder();

    let gameLoadTimer5 = setInterval(function() {
        try {
            if (window.genlite !== undefined) {
                window.GenLiteRecipeRecorder.init();
                clearInterval(gameLoadTimer5);
            }
        } catch (e) {}
    }, 1000);

    window.genliteWikiDataCollection = new GenLiteWikiDataCollection();

    let gameLoadTimer6 = setInterval(function() {
        try {
            if(window.genlite !== undefined) {
                window.genliteWikiDataCollection.init();
                clearInterval(gameLoadTimer6);
            }
        } catch (e) {
        }
    }, 1000);
})();


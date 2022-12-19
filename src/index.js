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
    await genlite.init();
    window.genlite = genlite;

    // TODO: genlite.addPlugin();
    window.genliteCamera = new GenLiteCameraPlugin();
    await window.genliteCamera.init();

    window.GenliteDropRecorder = new GenliteDropRecorder();
    await window.GenliteDropRecorder.init();

    window.genliteItemHighlight = new GenLiteItemHighlight();
    await window.genliteItemHighlight.init();

    window.genliteNotification = new GenLiteNotificationPlugin();
    await window.genliteNotification.init();

    window.genliteNPCHighlight = new GenLiteNPCHighlight();
    await window.genliteNPCHighlight.init();

    window.GenLiteRecipeRecorder = new GenLiteRecipeRecorder();
    await window.GenLiteRecipeRecorder.init();

    window.genliteWikiDataCollection = new GenLiteWikiDataCollection();
    await window.genliteWikiDataCollection.init();
})();


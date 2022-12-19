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

    await genlite.pluginLoader.addPlugin(GenLiteCameraPlugin);
    await genlite.pluginLoader.addPlugin(GenliteDropRecorder);
    await genlite.pluginLoader.addPlugin(GenLiteItemHighlight);
    await genlite.pluginLoader.addPlugin(GenLiteNotificationPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteNPCHighlight);
    await genlite.pluginLoader.addPlugin(GenLiteRecipeRecorder);
    await genlite.pluginLoader.addPlugin(GenLiteWikiDataCollection);
})();


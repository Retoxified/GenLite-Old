/** Core Features */
import { GenLite } from "./core/genlite.class";
import { GenLiteNotificationPlugin } from "./core/plugins/genlite-notification.plugin";

/** Official Plugins */
import { GenLiteCameraPlugin } from "./plugins/genlite-camera.plugin";
import { GenLiteDropRecorderPlugin } from "./plugins/gen-lite-drop-recorder.plugin";
import { GenLiteItemHighlightPlugin } from "./plugins/genlite-item-highlight.plugin";
import { GenLiteNPCHighlightPlugin } from "./plugins/genlite-npc-highlight.plugin";
import { GenLiteRecipeRecorderPlugin } from "./plugins/genlite-recipe-recorder.plugin";
import { GenLiteWikiDataCollectionPlugin } from "./plugins/genlite-wiki-data-collection.plugin";


(async function load() {
    const genlite = new GenLite();
    await genlite.init();
    window.genlite = genlite;

    /** Core Features */
    genlite.notifications = await genlite.pluginLoader.addPlugin(GenLiteNotificationPlugin);

    /** Official Plugins */
    await genlite.pluginLoader.addPlugin(GenLiteCameraPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteDropRecorderPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteItemHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteNPCHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteRecipeRecorderPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteWikiDataCollectionPlugin);
})();

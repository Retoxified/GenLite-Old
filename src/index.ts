/** Core Features */
import { GenLite } from "./core/genlite.class";
import { GenLiteNotificationPlugin } from "./core/plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./core/plugins/genlite-settings.plugin";

/** Official Plugins */
import { GenLiteCameraPlugin } from "./plugins/genlite-camera.plugin";
import { GenliteDropRecorderPlugin } from "./plugins/genlite-drop-recorder.plugin";
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
    genlite.settings = await genlite.pluginLoader.addPlugin(GenLiteSettingsPlugin);

    /** Official Plugins */
    await genlite.pluginLoader.addPlugin(GenLiteCameraPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteNPCHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteItemHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenliteDropRecorderPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteWikiDataCollectionPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteRecipeRecorderPlugin);
})();

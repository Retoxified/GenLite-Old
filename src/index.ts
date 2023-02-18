/** Core Features */
import { GenLite } from "./core/genlite.class";
import { GenLiteNotificationPlugin } from "./core/plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./core/plugins/genlite-settings.plugin";
import { GenLiteCommandsPlugin } from "./core/plugins/genlite-commands.plugin";

/** Official Plugins */
import { GenLiteCameraPlugin } from "./plugins/genlite-camera.plugin";
import { GenLiteDropRecorderPlugin } from "./plugins/genlite-drop-recorder.plugin";
import { GenLiteItemHighlightPlugin } from "./plugins/genlite-item-highlight.plugin";
import { GenLiteNPCHighlightPlugin } from "./plugins/genlite-npc-highlight.plugin";
import { GenLiteRecipeRecorderPlugin } from "./plugins/genlite-recipe-recorder.plugin";
import { GenLiteWikiDataCollectionPlugin } from "./plugins/genlite-wiki-data-collection.plugin";
import { GenLiteXpCalculator } from "./plugins/genlite-xp-calculator.plugin";
import { GenLiteHitRecorder } from "./plugins/genlite-hit-recorder.plugin";
import { GenLiteMenuScaler } from "./plugins/genlite-menu-scaler.plugin";
import { GenLiteMusicPlugin } from "./plugins/genlite-music.plugin";
import { GenLiteLocationsPlugin } from "./plugins/genlite-locations.plugin";
import { GenLiteMenuSwapperPlugin } from "./plugins/genlite-menuswapper.plugin";
import { GenLiteItemTooltips } from "./plugins/genlite-item-tooltips.plugin";
import { GenLiteSoundNotification } from "./plugins/genlite-sound-notification.plugin";
import { GenLiteGeneralChatCommands } from "./plugins/genlite-generalchatcommand.plugin";





(async function load() {
    const genlite = new GenLite();
    await genlite.init();
    window.genlite = genlite;

    /** Core Features */
    genlite.notifications = await genlite.pluginLoader.addPlugin(GenLiteNotificationPlugin);
    genlite.settings = await genlite.pluginLoader.addPlugin(GenLiteSettingsPlugin);
    genlite.commands = await genlite.pluginLoader.addPlugin(GenLiteCommandsPlugin);

    /** Official Plugins */
    await genlite.pluginLoader.addPlugin(GenLiteCameraPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteNPCHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteItemHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteDropRecorderPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteWikiDataCollectionPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteXpCalculator);
    await genlite.pluginLoader.addPlugin(GenLiteRecipeRecorderPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteHitRecorder);
    await genlite.pluginLoader.addPlugin(GenLiteMenuScaler);
    await genlite.pluginLoader.addPlugin(GenLiteMusicPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteLocationsPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteMenuSwapperPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteItemTooltips);
    await genlite.pluginLoader.addPlugin(GenLiteSoundNotification);
    await genlite.pluginLoader.addPlugin(GenLiteGeneralChatCommands);

    /** post init things */
    await window.GenLiteSettingsPlugin.postInit();
    await window.GenLiteNPCHighlightPlugin.postInit();
}
)();


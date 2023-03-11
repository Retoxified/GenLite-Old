/*
    Copyright (C) 2022-2023 Retoxified, dpeGit, FrozenReality
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

/** Core Features */
import { GenLite } from "./core/genlite.class";
import { GenLiteDeobfuscationPlugin } from './core/plugins/genlite-deobfuscation.plugin';
import { GenLiteNotificationPlugin } from "./core/plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./core/plugins/genlite-settings.plugin";
import { GenLiteCommandsPlugin } from "./core/plugins/genlite-commands.plugin";
import { GenLiteConfirmation } from "./core/helpers/genlite-confirmation.class";


/** Official Plugins */
import { GenLiteVersionPlugin } from "./plugins/genlite-version.plugin";
import { GenLiteCameraPlugin } from "./plugins/genlite-camera.plugin";
import { GenLiteChatPlugin } from "./plugins/genlite-chat.plugin";
import { GenLiteDropRecorderPlugin } from "./plugins/genlite-drop-recorder.plugin";
import { GenLiteInventoryPlugin } from "./plugins/genlite-inventory.plugin";
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
import { GenLitePlayerToolsPlugin }  from "./plugins/genlite-playertools.plugin";
import { GenLiteHighscores } from "./plugins/genlite-highscores.plugin";


const DISCLAIMER = `
GenLite is NOT associated with Rose-Tinted Games.
Do not talk about GenLite in the main discord.
Do not report bugs to the devs with GenLite enabled, they will ignore you and get annoyed.
Do disable GenLite first and test for the bug again.
If you find a bug and are unsure post in the GenLite Server. We will help you.
While we work to ensure compatibility, Use At Your Own Risk.
Press Cancel to Load, Press Okay to Stop.`;

(async function load() {
    let confirmed = localStorage.getItem("GenLiteConfirms");
    if (!confirmed && await GenLiteConfirmation.confirm(DISCLAIMER) === true)
        return;
    confirmed = "true";
    localStorage.setItem("GenLiteConfirms", confirmed);

    const genlite = new GenLite();

    genlite.deobfuscation = await genlite.pluginLoader.addPlugin(GenLiteDeobfuscationPlugin);
    await genlite.deobfuscation.deobfuscationComplete;

    await genlite.init();
    window.genlite = genlite;

    /** Core Features */
    genlite.notifications = await genlite.pluginLoader.addPlugin(GenLiteNotificationPlugin);
    genlite.settings = await genlite.pluginLoader.addPlugin(GenLiteSettingsPlugin);
    genlite.commands = await genlite.pluginLoader.addPlugin(GenLiteCommandsPlugin);

    /** Official Plugins */
    await genlite.pluginLoader.addPlugin(GenLiteVersionPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteCameraPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteChatPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteNPCHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteItemHighlightPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteInventoryPlugin);
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
    await genlite.pluginLoader.addPlugin(GenLitePlayerToolsPlugin);
    await genlite.pluginLoader.addPlugin(GenLiteHighscores);

    /** post init things */
    await window.GenLiteSettingsPlugin.postInit();
    await window.GenLiteNPCHighlightPlugin.postInit();
    await window.GenLiteDropRecorderPlugin.postInit();

}
)();


/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

/** Core Features */
import { GenLite } from "./core/genlite.class";
import { GenLiteNotificationPlugin } from "./core/plugins/genlite-notification.plugin";
import { GenLiteSettingsPlugin } from "./core/plugins/genlite-settings.plugin";
import { GenLiteCommandsPlugin } from "./core/plugins/genlite-commands.plugin";
import { GenLiteConfirmation } from "./core/helpers/genlite-confirmation.class";
import { GenLiteDatabasePlugin } from "./core/plugins/genlite-database.plugin";

/** Official Plugins */
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
import { GenLiteItemTooltips } from "./plugins/genlite-item-tooltips.plugin";
import { GenLiteSoundNotification } from "./plugins/genlite-sound-notification.plugin";
import { GenLiteGeneralChatCommands } from "./plugins/genlite-generalchatcommand.plugin";
import { GenLiteUIPlugin } from "./core/plugins/genlite-ui-plugin";
import { GenLitePlayerToolsPlugin } from "./plugins/genlite-playertools.plugin";
import { GenLiteHighscores } from "./plugins/genlite-highscores.plugin";
import { GenLiteItemDisplays } from "./plugins/genlite-itemdisplay.plugin";
import { GenLiteHealthRegenerationPlugin } from './plugins/genlite-health-regeneration.plugin';
import { GenLiteFPSCounter } from "./plugins/genlite-fps.plugin";
import { GenLiteEnhancedContextMenu } from "./plugins/genlite-enhanced-context-menu.plugin";
import { GenLiteQuestPlugin } from "./plugins/genlite-quest.plugin";
import { GenLiteEnhancedBanking } from "./plugins/genlite-enhanced-banking.plugin";
import { GenLiteTaggingPlugin } from "./plugins/genlite-tagging.plugin";

// TODO: use globals.ts?
declare global {
    interface Document {
        game: any;
        client: any;
        genlite: {
            [key: string]: any,
            settings: GenLiteSettingsPlugin,
        };
        initGenLite: () => void;
    }
}

const DISCLAIMER = [
    "GenLite is NOT associated with Rose-Tinted Games.",
    "DO NOT talk about GenLite in the Genfanad Discord.",
    "DO NOT report bugs to Genfanad with GenLite enabled. They will ignore you and get annoyed.",
    "DO disable GenLite first and test for the bug again.",
    "If you find a bug and are unsure, post in the GenLite Discord. We will help you.",
    "While we work to ensure compatibility, Use At Your Own Risk.",
];

let isInitialized = false;

(async function load() {
    async function initGenLite() {

        function gameObject(
            name: string,
            minified: string,
            parent: Object = null
        ): any {
            var o = document.client.get(minified);
            if (!o) {
                console.log(`${minified} (${name}) is not defined: ${o}`);
            }

            if (!parent) {
                parent = document.game;
            }
            parent[name] = o;
        }

        document.game = {};
        document.game.ITEM_RIGHTCLICK_LIMIT = 20; // TODO: Is this equivalent? It seems to no longer be included in client.js


        // Classes
        gameObject('Bank', 'tv');
        gameObject('Chat', 'rv');
        gameObject('Actor', 'Dg');
        gameObject('Animation', 'h_');
        gameObject('Camera', 'DS');
        gameObject('Character', 'A_');
        gameObject('DeduplicatingCachedLoader', 'wS');
        gameObject('FadeAnimation', 'd_');
        gameObject('FrozenEffect', 'Gg');
        gameObject('Game', 'X_');
        gameObject('Graphics', 'NS');
        gameObject('HumanCharacter', 'jg');
        gameObject('ItemStack', 'Lg');
        gameObject('MinimapRenderer', 'j_');
        gameObject('ModelProjectileAnimation', 'g_');
        gameObject('MonsterCharacter', 'Hg');
        gameObject('Network', 'ug');
        gameObject('NewSegmentLoader', 'yS');
        gameObject('OptimizedScene', 'PS');
        gameObject('PassThroughSpineTexture', 'Pg');
        gameObject('Player', 'O_');
        gameObject('Seed', 'z_');
        gameObject('Segment', 'B_');
        gameObject('ShrinkForBoatAnimation', 'p_');
        gameObject('SpriteAnimation', '__');
        gameObject('SpriteProjectileAnimation', 'f_');
        gameObject('TeleportAnimation', 'u_');
        gameObject('TemporaryScenery', 'H_');
        gameObject('WorldManager', 'IS');
        gameObject('WorldObject', 'E_');
        gameObject('Math', 'xi', document.game.THREE);
        gameObject('SFXPlayer', '$m');
        gameObject('PlayerHUD', 'zv');
        gameObject('PlayerInfo', 'Xg');
        gameObject('Inventory', 'Cv');
        gameObject('PhasedLoadingManager', 'gS');
        gameObject('Trade', 'Hv');
        gameObject('Friends', 'G_');


        // Objects
        gameObject('BANK', 'ew');
        gameObject('CHAT', 'nw');
        gameObject('DATA', 'Qy');
        gameObject('FRIENDS', 'dw');
        gameObject('GAME', 'K_.game');
        gameObject('GRAPHICS', 'KS.graphics');
        gameObject('INVENTORY', 'uw');
        gameObject('NETWORK', 'pg.network');
        gameObject('PHASEDLOADINGMANAGER', 'gS');
        gameObject('PLAYER', '$S.player');
        gameObject('SFX_PLAYER', 'Jm');
        gameObject('WORLDMANAGER', 'IS');
        gameObject('MUSIC_PLAYER', 'Nv');
        gameObject('MUSIC_TRACK_NAMES', 'Pv');
        gameObject('SETTINGS', 'bw');
        gameObject('THREE', 'e');
        gameObject('PLAYER_INFO', 'fw');
        gameObject('NPC', 'I_');
        gameObject('TRADE', 'Mw');
        gameObject('NETWORK_CONTAINER', 'mg');
        gameObject('FRIENDS', 'dw');

        /* Special Case Objects */
        /* have to do this here because keyboard is constantly redefined */
        gameObject('KEYBOARD', 'XS');
        hookKeyboard();

        //Functions
        gameObject('returnsAnItemName', 'Mg');
        gameObject('getStaticPath', 'O');
        gameObject('toDisplayName', 'W_');

        //Constants
        gameObject('SOME_CONST_USED_FOR_BANK', 'P');

        if (isInitialized) {
            document.genlite.onUIInitialized();
            return;
        }
        isInitialized = true;

        const genlite = new GenLite();
        document.genlite = genlite;
        await genlite.init();

        /** Core Features */
        genlite.notifications = await genlite.pluginLoader.addPlugin(GenLiteNotificationPlugin);
        genlite.settings = await genlite.pluginLoader.addPlugin(GenLiteSettingsPlugin);
        genlite.commands = await genlite.pluginLoader.addPlugin(GenLiteCommandsPlugin);
        genlite.database = await genlite.pluginLoader.addPlugin(GenLiteDatabasePlugin);
        genlite.ui = await genlite.pluginLoader.addPlugin(GenLiteUIPlugin);

        /** Official Plugins */
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
        await genlite.pluginLoader.addPlugin(GenLiteItemTooltips);
        await genlite.pluginLoader.addPlugin(GenLiteSoundNotification);
        await genlite.pluginLoader.addPlugin(GenLiteGeneralChatCommands);
        await genlite.pluginLoader.addPlugin(GenLitePlayerToolsPlugin);
        await genlite.pluginLoader.addPlugin(GenLiteHighscores);
        await genlite.pluginLoader.addPlugin(GenLiteItemDisplays);
        await genlite.pluginLoader.addPlugin(GenLiteHealthRegenerationPlugin);
        await genlite.pluginLoader.addPlugin(GenLiteFPSCounter);
        await genlite.pluginLoader.addPlugin(GenLiteEnhancedContextMenu);
        await genlite.pluginLoader.addPlugin(GenLiteQuestPlugin);
        await genlite.pluginLoader.addPlugin(GenLiteEnhancedBanking);
        await genlite.pluginLoader.addPlugin(GenLiteTaggingPlugin);

        /** post init things */
        // await document['GenLiteDatabasePlugin'].postInit();
        // await document['GenLiteSettingsPlugin'].postInit();
        // await document['GenLiteNPCHighlightPlugin'].postInit();
        // await document['GenLiteDropRecorderPlugin'].postInit();

        // NOTE: currently initGenlite is called after the scene has started
        //       (in minified function qS). The initializeUI function does not
        //       exist in genfanad and is inlined in qS. So at this point, UI
        //       is already initialized and we update the plugins.
        //
        //       We should eventually move genlite to init at page start, then
        //       this needs to move to the qS override at the bottom of this
        //       file.
        // NOTE 2: This is now also used to call postInit on plugins through GenLitePluginLoader
        //         The GenLiteUIPlugin.registerPlugin function requires being present in the postInit for a function
        //         as it calls various things involving settings that may not be ready until after init.
        genlite.onUIInitialized();
    }

    function hookStartScene() {
        if (localStorage.getItem("GenLiteConfirms") === "true") {
            let doc = (document as any);
            doc.client.set('document.client.originalStartScene', doc.client.get('qS'));
            doc.client.set('qS', function () {
                document.client.originalStartScene();
                setTimeout(document.initGenLite, 100);
            });
        }
    }

    /* KEYBOARD is redefined everytime the get gets focus
        so we set a second listener with a small timeout that sets out variable just after genfanads
        this feels really fucking hacky though
    */
    function hookKeyboard() {
        window.addEventListener("focus", (e) => {
            setTimeout(() => {
                document.game.KEYBOARD = document.client.get('XS');
            }, 10);
        });
    }

    window.addEventListener('load', (e) => {
        document.initGenLite = initGenLite;

        let confirmed = localStorage.getItem("GenLiteConfirms");
        if (confirmed === "true") {
            hookStartScene();
        } else {
            GenLiteConfirmation.confirmModal(DISCLAIMER, async () => {
                // calls back only if accepted
                localStorage.setItem("GenLiteConfirms", "true");
                hookStartScene();
            });
        }
    });

    function firefoxOverride(e) {
        let src = e.target.src;
        if (src === 'https://play.genfanad.com/play/js/client.js') {
            e.preventDefault(); // do not load
            e.stopPropagation();
            var script = document.createElement('script');
            script.textContent = genfanadJS;
            script.type = 'module';
            (document.head || document.documentElement).appendChild(script);
        }
    }
    
    let genfanadJS = localStorage.getItem("GenFanad.Client");
    if (!genfanadJS) {
        console.error("GenFanad.Client not found in localStorage. GenLite will not work.");
    } else {
        genfanadJS = genfanadJS.replace(/window\.innerWidth/g, "document.body.clientWidth");
        genfanadJS = genfanadJS.replace(/background-image: linear-gradient\(var\(--yellow-3\), var\(--yellow-3\)\);/g, "");
        
        // if (document.head) {
        //     throw new Error('Head already exists - make sure to enable instant script injection');
        // }
        
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        
        if (isFirefox) {
            document.addEventListener("beforescriptexecute", firefoxOverride, true);
        } else {
            new MutationObserver((_, observer) => {
                const clientjsScriptTag = document.querySelector('script[src*="client.js"]');
                if (clientjsScriptTag) {
                    clientjsScriptTag.removeAttribute('src');
                    clientjsScriptTag.textContent = genfanadJS;
                }
            }).observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    }
})();

import { GenLitePlugin } from '../interfaces/plugin.interface';

/**
 * Exposes the most recently created WebSocket instance to window.genlite.socket
 * the socket typically uses socket.io and can be used for listening to messages in any plugin, e.g:
 * @example
 * window.genlite.on("stats", (data) => { console.log(data); });
 */
export class GenLiteWebSocketPlugin implements GenLitePlugin {
    static pluginName = 'GenLiteWebSocketPlugin';

    public socket: WebSocket;

    async init() {
      const originalWebSocket: any = WebSocket;

      (window.WebSocket as any) = function (...args) {
        console.log(`[${GenLiteWebSocketPlugin.pluginName}] WebSocket hook successful.`);
        window.genlite.socket = new originalWebSocket(...args);

        return window.genlite.socket;
      }
    }
}

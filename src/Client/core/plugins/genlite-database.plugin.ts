/*
    Copyright (C) 2023 KKonaOG dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

import { GenLitePlugin } from "../interfaces/plugin.class";

type DatabaseCallback = (db: IDBDatabase) => void;
type StoreCallback = (db: IDBObjectStore) => void;

export class GenLiteDatabasePlugin extends GenLitePlugin {
    public static pluginName = 'GenLiteDatabasePlugin';
    public static dbName = 'GenLiteDatabase';
    public static version = 4;

    public supported = false;
    public initialized = false;

    stores: Array<{ callback: DatabaseCallback }> = [];

    async init() {
        document.genlite.registerPlugin(this);
    }

    public add(callback: DatabaseCallback) {
        this.stores.push({
            callback: callback
        });
    }

    public open(callback: DatabaseCallback) {
        if (!this.supported) {
            return;
        }

        let r = this.request();
        if (r) {
            r.onsuccess = (e) => {
                callback(r.result);
            }
        }
    }

    public storeTx(
        store: string,
        rw: 'readwrite' | 'readonly',
        callback: StoreCallback
    ) {
        if (!this.supported) {
            return;
        }

        let r = this.request();
        if (r) {
            r.onsuccess = (e) => {
                let db = r.result;
                let tx = db.transaction(store, rw);
                callback(tx.objectStore(store));
            }
        }
    }

    request(ignoreInit=false) {
        if (!ignoreInit && !this.initialized) {
            console.log("IDB is not yet initialized");
            return null;
        }
        if (!this.supported) {
            return null;
        }

        let r = window.indexedDB.open(
            GenLiteDatabasePlugin.dbName,
            GenLiteDatabasePlugin.version
        );
        r.onerror = (e) => {
            this.error(e);
        };

        return r;
    }

    async postInit() {
        this.supported = 'indexedDB' in window;
        let r = this.request(true);
        if (r) {
            r.onsuccess = (e) => {
                // TODO: plugin onopen actions
                r.result.close();
                this.initialized = true;
            };
            r.onupgradeneeded = (e: any) => {
                let db = e.target.result;
                for (const store of this.stores) {
                    try {
                        store.callback(db);
                    } catch (err) {
                        this.error('creating store: ', err);
                    }
                }
            };
        }
    }

    handlePluginState(state: boolean): void {
        // TODO: Implement
    }

}

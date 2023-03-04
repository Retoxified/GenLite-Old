type DatabaseCallback = (db: IDBDatabase) => void;
type StoreCallback = (db: IDBObjectStore) => void;

export class GenLiteDatabasePlugin {
    public static pluginName = 'GenLiteDatabasePlugin';
    public static dbName = 'GenLiteDatabase';
    public static version = 2;

    public supported = false;

    stores: Array<{callback: DatabaseCallback}> = [];

    async init() {
        window.genlite.registerPlugin(this);
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
        rw: 'readwrite'|'readonly',
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

    request() {
        if (!this.supported) {
            return null;
        }

        let r = window.indexedDB.open(
            GenLiteDatabasePlugin.dbName,
            GenLiteDatabasePlugin.version
        );
        r.onerror = (e) => {
            console.log('GenLiteDatabaseError: ' + e);
        };

        return r;
    }

    async postInit() {
        this.supported = 'indexedDB' in window;
        let r = this.request();
        if (r) {
            r.onsuccess = (e) => {
                // TODO: plugin onopen actions
                r.result.close();
            };
            r.onupgradeneeded = (e: any) => {
                let db = e.target.result;
                for (const store of this.stores) {
                    store.callback(db);
                }
            };
        }
    }

}

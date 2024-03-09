import { ConnectionSchema } from '$lib/schema/schema';
import { store } from '$lib/components/store/application-store';
import { StoreKeys } from '$lib/constants/enums';
import { type Readable, readonly, writable, type Writable } from 'svelte/store';

const internalStoreSavedConnections : Writable<ConnectionSchema[]> = writable(reconstruct([]))
export const savedConnections : Readable<ConnectionSchema[]> = readonly(internalStoreSavedConnections);

const internalStoreHistory : Writable<ConnectionSchema[]> = writable(reconstruct([]));
export const histories : Readable<ConnectionSchema[]> = readonly(internalStoreHistory);

export async function restoreConnectionHistoryServices(){
    internalStoreSavedConnections.set(reconstruct(await store.getOrDefault<ConnectionSchema[]>(StoreKeys.SavedConnections, [])));
    internalStoreHistory.set(reconstruct(await store.getOrDefault<ConnectionSchema[]>(StoreKeys.History, [])));
}

function reconstruct(conn : ConnectionSchema[]) : ConnectionSchema[] {
    const reconstructed : ConnectionSchema[] = [];
    for (let connectionSchema of conn) {
        reconstructed.push(new ConnectionSchema(
          connectionSchema.id,
          connectionSchema.name,
          connectionSchema.endpoint,
          connectionSchema.primaryKey,
          connectionSchema.databases,
          connectionSchema.lastConnected,
          connectionSchema.badgeText,
          connectionSchema.badgeColor,
          connectionSchema.lastUsedDatabase
        ));
    }
    return reconstructed;
}

export async function addConnectionSchema(conn: ConnectionSchema, temp : boolean = false) {
    internalStoreSavedConnections.update((current) =>{
        current.push(conn);
        store.set(StoreKeys.SavedConnections, current.filter(x => !x.temp));
        return current;
    })
}

export async function updateConnectionSchema(conn: ConnectionSchema, temp: boolean = false) {
    internalStoreSavedConnections.update((current) => {
        const index = current.findIndex(x => x.id === conn.id);
        if (index === -1) {
            return current; // Connection doesn't exist, return the current array unchanged
        }

        // Update the connection at the found index with the new connection data
        current[index] = conn;

        // Update the store with the connections that are not temporary
        const nonTempConnections = current.filter(x => !x.temp);
        store.set(StoreKeys.SavedConnections, nonTempConnections);

        return current;
    });
}

export async function getConnectionSchema(id : string) : Promise<Nullable<ConnectionSchema>>{
    let connSchema : Nullable<ConnectionSchema> = null;
    const unsub = internalStoreSavedConnections.subscribe((sub) => {
        connSchema = sub.find(x => x.id === id) ?? null;
    })
    unsub();
    return connSchema;
}

export async function removeConnectionSchema(conn: ConnectionSchema): Promise<void> {
    internalStoreSavedConnections.update((current) => {
        const updated = current.filter((x) => x.id !== conn.id);
        store.set(StoreKeys.SavedConnections, updated.filter(x => !x.temp))
        return updated // Use your custom comparison function
    });
}

export async function addToHistory(conn : ConnectionSchema) : Promise<void>{
    internalStoreHistory.update((current) =>{
        current.push(conn);
        store.set(StoreKeys.History, current);
        return current;
    })
}

export async function removeFromHistory(conn : ConnectionSchema) : Promise<void>{
    internalStoreSavedConnections.update((current) => {
        const updated = current.filter((x) => x.id !== conn.id);
        store.set(StoreKeys.SavedConnections, updated)
        return updated
    });
}


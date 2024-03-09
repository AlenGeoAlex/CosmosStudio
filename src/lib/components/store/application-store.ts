import { type StoreKeys } from '$lib/constants/enums';

import { browser } from '$app/environment';
import { DynamicKey } from '$lib/utils';
import { Store } from 'tauri-plugin-store-api';
import { BaseDirectory } from '@tauri-apps/api/fs';

interface IStore {
    get<T>(key : StoreKeys | DynamicKey) : Promise<Nullable<T>>;

    getOrDefault<T>(key : StoreKeys | DynamicKey, defaultValue : T) : Promise<T>;

    set<T>(key : StoreKeys | DynamicKey, val : T) : void;

    remove(key : StoreKeys | DynamicKey) : Promise<void>;
}

interface IFileStore {
    get<T>(key : DynamicKey) : Promise<Nullable<T>>;

    getOrDefault<T>(key :  DynamicKey, defaultValue : T) : Promise<T>;

    set<T>(key : DynamicKey, val : T) : void;

    remove(key : DynamicKey) : Promise<void>;

    getFiles<T>(key : DynamicKey) : Promise<T[]>;
}

export interface IApplicationStore extends IStore{
    fileStore() : IFileStore;
}


class BrowserStore implements IApplicationStore {

    private _fileStore : Nullable<IFileStore> = null;

    async get<T>(key: StoreKeys | DynamicKey): Promise<Nullable<T>> {
        const data = localStorage.getItem(getKey(key))
        return (data === null) ? null : JSON.parse(data)
    }

    async getOrDefault<T>(key: StoreKeys | DynamicKey, defaultValue: T) : Promise<T> {
        const data = localStorage.getItem(getKey(key))
        if(data === null){
            this.set(key, defaultValue)
            return defaultValue
        }
        return JSON.parse(data)
    }

    set<T>(key: StoreKeys | DynamicKey, val: T) : void {
        localStorage.setItem(getKey(key), JSON.stringify(val));
    }

    async remove(key: StoreKeys | DynamicKey): Promise<void> {
        localStorage.removeItem(getKey(key));
    }

    fileStore() : IFileStore {
        if(this._fileStore === null || this._fileStore === undefined){
            this._fileStore = new BrowserFileStore();
        }

        return this._fileStore;
    }
}

class BrowserFileStore implements IFileStore {
    async get<T>(key: DynamicKey): Promise<Nullable<T>> {
        const data = localStorage.getItem(getKey(key))
        return (data === null) ? null : JSON.parse(data)
    }

    async getOrDefault<T>(key: DynamicKey, defaultValue: T): Promise<T> {
        const data = localStorage.getItem(getKey(key))
        if(data === null){
            await this.set(key, defaultValue)
            return defaultValue
        }
        return JSON.parse(data)
    }

    async set<T>(key: DynamicKey, val: T): Promise<void> {
        localStorage.setItem(getKey(key), JSON.stringify(val));
    }

    async remove(key: DynamicKey): Promise<void> {
        localStorage.removeItem(getKey(key));
    }

    async getFiles<T>(key: DynamicKey): Promise<T[]> {
        const response : T[] = [];
        const dyKey = key.key;
        let path = dyKey.split(DynamicKey.delimiter)
        path = path.splice(-1, 1);
        const filePath = path.join(DynamicKey.delimiter);
        for (let localStorageKey in localStorage) {
            if(localStorageKey.startsWith(filePath)){
                const data = localStorage.getItem(localStorageKey)
                if(data === null || data === undefined)
                    continue;

                response.push(JSON.parse(data));
            }
        }

        return response;
    }


}

class NonBrowserStore implements IApplicationStore {
    private _fileStore : Nullable<IFileStore> = null;
    private readonly _storeCache : Map<string, Store> = new Map<string, Store>();
    async get<T>(key: StoreKeys | DynamicKey): Promise<Nullable<T>> {
        const tauriStore = await this.getOrCreateStore(key);
        const data = await tauriStore.get(getKey(key));
        console.log(data, getKey(key));
        return (data === null) ? null : JSON.parse(data as string)
    }

    async getOrDefault<T>(key: StoreKeys | DynamicKey, defaultValue: T): Promise<T> {
        const tauriStore = await this.getOrCreateStore(key);
        const data = await tauriStore.get(getKey(key));
        if(data === null || data === undefined){
            await this.set(key, defaultValue)
            return defaultValue;
        }

        return JSON.parse(data as string);
    }

    async set<T>(key: StoreKeys | DynamicKey, val: T): Promise<void> {
        const tauriStore = await this.getOrCreateStore(key);
        await tauriStore.set(getKey(key), JSON.stringify(val));
        await tauriStore.save();
    }

    fileStore(): IFileStore {
        if(this._fileStore === null || this._fileStore === undefined){
            this._fileStore = new NonBrowserFileStore();
        }

        return this._fileStore;
    }

    async remove(key: StoreKeys | DynamicKey): Promise<void> {
        const tauriStore = await this.getOrCreateStore(key);
        await tauriStore.delete(getKey(key));
    }



    private async getOrCreateStore(key: StoreKeys | DynamicKey) : Promise<Store> {
        if(key instanceof DynamicKey){
            let prefix = key.prefix;
            if(prefix.endsWith("-")){
                prefix = prefix.slice(0, -1);
            }
            return await this.getOrCreateStoreInternal(prefix);
        }else{
            return await this.getOrCreateStoreInternal(".interstr");
        }
    }

    private async getOrCreateStoreInternal(strKey : string) : Promise<Store>{
        let str = this._storeCache.get(strKey);
        if(str === undefined){
           str = new Store(`${strKey}.cst`);
           this._storeCache.set(strKey, str);
        }

        return str;
    }
}

class NonBrowserFileStore implements IFileStore {
    private readonly byteEncoder = new TextEncoder();
    private readonly byteDecoder = new TextDecoder();
    private tauriFsModule: Nullable<typeof import('@tauri-apps/api/fs')>;
    private tauriPathModule : Nullable<typeof import('@tauri-apps/api/path')>;
    async get<T>(key: DynamicKey): Promise<Nullable<T>> {
        const tauri = await this.getTauriFileModule();
        const fileIdentification = await this.joinPath(key);
        const fileExists = await tauri.exists(fileIdentification.fullPath, {
            dir: tauri.BaseDirectory.AppData
        });

        if(!fileExists)
            return undefined;

        const binaryFile = await tauri.readBinaryFile(fileIdentification.fullPath, {
            dir: tauri.BaseDirectory.AppData
        });

        const data = this.byteDecoder.decode(binaryFile);
        return (data === null) ? null : JSON.parse(data as string)
    }

    async getOrDefault<T>(key: DynamicKey, defaultValue: T): Promise<T> {
        const tauri = await this.getTauriFileModule();
        const fileIdentification = await this.joinPath(key);
        const fileExists = await tauri.exists(fileIdentification.fullPath, {
            dir: tauri.BaseDirectory.AppData
        });
        if(!fileExists)
        {
            await this.set<T>(key, defaultValue);
            return defaultValue;
        }
        const binaryFile = await tauri.readBinaryFile(fileIdentification.fullPath, {
            dir: tauri.BaseDirectory.AppData
        });

        const data = this.byteDecoder.decode(binaryFile);
        if(data === null){
            await this.set<T>(key, defaultValue);
            return defaultValue;
        }
        return JSON.parse(data);
    }

    async set<T>(key: DynamicKey, val: T): Promise<void> {
        const jsonString = JSON.stringify(val);
        const binaryData = this.byteEncoder.encode(jsonString);
        const fileIdentification = await this.joinPath(key);
        const tauri = await this.getTauriFileModule();
        const folderExists = await tauri.exists(fileIdentification.path, {
            dir: tauri.BaseDirectory.AppData
        });
        if(!folderExists){
            await tauri.createDir(fileIdentification.path, {
                dir: BaseDirectory.AppData,
                recursive: true
            });
        }

        await tauri.writeBinaryFile(fileIdentification.fullPath, binaryData, {
            dir: tauri.BaseDirectory.AppData
        });
    }

    async remove(key: DynamicKey): Promise<void> {
        const path = await this.joinPath(key);
        const tauri = await this.getTauriFileModule();
        await tauri.removeFile(path.fullPath, {
            dir: tauri.BaseDirectory.AppData
        })
    }

    async getFiles<T>(key: DynamicKey): Promise<T[]> {
        const response : T[] = [];
        const filePath = await this.joinPath(key);
        const tauri = await this.getTauriFileModule();
        const folderExists = await tauri.exists(filePath.path, {
            dir: tauri.BaseDirectory.AppData
        });
        if(!folderExists)
            return response;

        const fileEntries = await tauri.readDir(filePath.path, {
            dir: tauri.BaseDirectory.AppData,
            recursive: false
        });

        const pathModule = await this.getTauriPathModule();
        for (let fileEntry of fileEntries) {
            if(fileEntry.children !== undefined)
                continue;

            if(fileEntry.name === undefined)
                continue;

            const newFilePath : string[] = key.key.split(DynamicKey.delimiter);
            newFilePath.length--;
            newFilePath.push(fileEntry.name);
            const fileDirectory = await pathModule.join(...newFilePath);
            const binaryFile = await tauri.readBinaryFile(fileDirectory, {
                dir: tauri.BaseDirectory.AppData
            });

            const data = this.byteDecoder.decode(binaryFile);
            if(data === null){
                continue;
            }
            response.push(JSON.parse(data))
        }

        return response;
    }




    private async joinPath(key : DynamicKey) : Promise<{path : string, name : string, fullPath : string}> {
        const pathModule = await this.getTauriPathModule();
        const stringPaths = key.key.split(":");
        const fileName = stringPaths[stringPaths.length - 1];
        const paths = [...stringPaths];
        paths.length--;
        return {
            path: await pathModule.join(...paths),
            name: fileName,
            fullPath: await pathModule.join(...stringPaths)
        };
    }

    private async getTauriFileModule(){
        if(this.tauriFsModule === null || this.tauriFsModule === undefined){
            this.tauriFsModule = await import('@tauri-apps/api/fs');
        }

        return this.tauriFsModule;
    }

    private async getTauriPathModule(){
        if(this.tauriPathModule === null || this.tauriPathModule === undefined){
            this.tauriPathModule = await import('@tauri-apps/api/path');
        }

        return this.tauriPathModule;
    }
}

function getKey(key: StoreKeys | DynamicKey) : string {
    if(key instanceof DynamicKey)
        return (key as DynamicKey).key;

    return  key.toString();
}

export const store : IApplicationStore = browser && !('__TAURI__' in window) ? new BrowserStore() : new NonBrowserStore();
import type { ConsoleType } from '$lib/constants/enums';

export class ConnectionSchema {
    id : string
    name : string;
    endpoint : string;
    primaryKey : string;
    databases : string[];
    lastConnected : number;
    badgeText : string | undefined;
    badgeColor : "red" | "yellow" | "green" | "indigo" | "purple" | "pink" | "blue" | "dark" | "primary" | "none" | undefined;
    temp : boolean = false;
    lastUsedDatabase : string | undefined;

    [key: string]: any;

    constructor(id : string ,name: string, endpoint: string, primaryKey: string, databases: string[], lastConnected: number, badgeText : string | undefined = undefined, badgeColor : "red" | "yellow" | "green" | "indigo" | "purple" | "pink" | "blue" | "dark" | "primary" | "none" | undefined = 'none', lastUsedDatabase : string | undefined) {
        this.id = id;
        this.name = name;
        this.endpoint = endpoint;
        this.primaryKey = primaryKey;
        this.databases = databases;
        this.lastConnected = lastConnected;
        this.badgeText = badgeText;
        this.badgeColor = badgeColor;
        this.lastUsedDatabase = lastUsedDatabase;
    }

    public updateDatabases(dbs : string[]) : void {
        if(this.databases.length === 0){
            dbs.forEach(x => {
                this.databases.push(x)
            });
        }else{
            this.databases = this.databases.filter(x => dbs.includes(x));
        }
    }

    public updateLastUsed(db : string) : void {
        this.lastUsedDatabase = db;
    }
}

export declare interface IConsole {
    id: string
    name : string,
    boundContainer : string
    lastUpdated: number,
    content : any,
    consoleType : ConsoleType
}

export declare interface IContainerActor {
    name: string,
    consoleId?: string
}


export declare interface IDocumentList {
    id : string,
    partitionKey : string
}

export declare interface IApplicationSettings {
    resizableSize : number
}

export const defaultAppSettings : IApplicationSettings = {
    resizableSize: 22
}
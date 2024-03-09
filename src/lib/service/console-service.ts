import { type Readable, readonly, writable, type Writable } from 'svelte/store';
import type { IConsole } from '$lib/schema/schema';
import { DynamicKey } from '$lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { ConsoleType } from '$lib/constants/enums';
import { store } from '$lib/components/store/application-store';

export class ConsoleService {

	private static readonly writableStore : Map<string, Writable<IConsole[]>> = new Map<string, Writable<IConsole[]>>();
	private static readonly readStore : Map<string, Readable<IConsole[]>> = new Map<string, Readable<IConsole[]>>();

	public static async create(connectionId : string, dbName : string, containerName : string, type : ConsoleType = ConsoleType.Query) : Promise<IConsole>{
		const {writeStore : writable} = await ConsoleService.getStore(connectionId, dbName);
		let existingCount : number = 0;
		const unsub = writable.subscribe(x => {
			existingCount = x.length;
		});

		unsub();
		const consoleName: string = `console-${existingCount + 1}`;
		const id = uuidv4();

		const cs : IConsole = {
			id: id,
			name: consoleName,
			boundContainer: containerName,
			content: undefined,
			lastUpdated: Date.now(),
			consoleType: type
		}

		const key = DynamicKey.of([connectionId, dbName, cs.id], "console");
		writable.update(x => {
			x.push(cs)
			store.fileStore().set(key, cs);
			return x;
		})
		return cs;
	}

	public static async copy(connectionId : string, dbName : string, copyRef : IConsole) : Promise<IConsole>{
		const {writeStore : writable} = await ConsoleService.getStore(connectionId, dbName);
		let existingCount : number = 0;
		const unsub = writable.subscribe(x => {
			existingCount = x.length;
		});

		unsub();
		const consoleName: string = `console-${existingCount + 1}`;
		const id = uuidv4();

		const console : IConsole = {
			id: id,
			name: consoleName,
			boundContainer: copyRef.boundContainer,
			content: copyRef.content,
			lastUpdated: Date.now(),
			consoleType: copyRef.consoleType
		}
		const key = DynamicKey.of([connectionId, dbName, console.id], "console");
		writable.update(x => {
			x.push(console)
			store.fileStore().set(key, console);
			return x;
		})
		return console;
	}

	public static async get(connectionId : string, dbName: string, consoleId: string) : Promise<Nullable<IConsole>> {
		const {writeStore : writable} = await ConsoleService.getStore(connectionId, dbName);
		const key = DynamicKey.of([connectionId, dbName, consoleId], "console");
		let cs : Nullable<IConsole> = null;
		const unsub = writable.subscribe(async x => {
			cs = x.find(x => x.id === consoleId);
			if(cs === null || cs === undefined){
				const consoleInFile = await store.fileStore().get<IConsole>(key);
				if(consoleInFile){
					cs = consoleInFile;
					writable.update(y => {
						y.push(consoleInFile)
						return y;
					})
				}
			}
		});
		unsub();
		return cs;
	}

	public static async delete(connectionId : string, dbName: string, consoleId: string) {
		const {writeStore : writable} = await ConsoleService.getStore(connectionId, dbName);
		const key = DynamicKey.of([connectionId, dbName, consoleId], "console");
		writable.update(x => {
			const consoleUpdated = x.filter(x => x.id !== consoleId);
			store.fileStore().remove(key)
			return consoleUpdated;
		})
	}

	public static async storeOf(connectionId : string, dbName : string) : Promise<Readable<IConsole[]>>{
		return (await ConsoleService.getStore(connectionId, dbName)).readStore;
	}

	private static async getStore(connectionId : string, dbName : string) :
	Promise<{writeStore : Writable<IConsole[]>, readStore : Readable<IConsole[]>}> {
		const key = DynamicKey.of([connectionId, dbName, 'all'], "console");

		let write = this.writableStore.get(key.key);
		let read = this.readStore.get(key.key);

		if(write === undefined){
			const consoles = await store.fileStore().getFiles<IConsole>(key);
			write = writable<IConsole[]>(consoles);
			this.writableStore.set(key.key, write);
		}

		if(read === undefined){
			read = readonly(write);
			this.readStore.set(key.key, read)
		}

		return {
			writeStore: write,
			readStore: read
		}
	}

}


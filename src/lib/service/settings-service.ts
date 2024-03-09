import { type Readable, readonly, writable, type Writable } from 'svelte/store';
import { defaultAppSettings, type IApplicationSettings } from '$lib/schema/schema';
import { store } from '$lib/components/store/application-store';
import { StoreKeys } from '$lib/constants/enums';

const settingsWritable : Writable<IApplicationSettings> = writable(await store.getOrDefault<IApplicationSettings>(StoreKeys.AppSettings, defaultAppSettings))
export const settings : Readable<IApplicationSettings> = readonly(settingsWritable);

export class AppSettings {

	public static setResizableSize(value : number){
		settingsWritable.update(x => {
			x.resizableSize = value;
			return x;
		})
	}

	public static isTauri(){
		return '__TAURI__' in window
	}

}
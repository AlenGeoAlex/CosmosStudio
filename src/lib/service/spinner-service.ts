import {type Readable, readonly, writable, type Writable } from 'svelte/store';
import { type JumperOption } from '$lib/components/shared/commons/models';

const jumperStoreInternal : Writable<Nullable<JumperOption>> = writable(null);
export const jumper : Readable<Nullable<JumperOption>> = readonly(jumperStoreInternal);
export class SpinnerService {

	public static set(text : string | undefined = undefined, clr : 'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white' = "red", size : number = 8, short : boolean = false){
		const opt : JumperOption = {
			color : clr === undefined ? "red" : clr,
			text : text,
			size : 8,
			shorted: short
		}

		jumperStoreInternal.set(opt);
	}

	public static setWithOptions(opt : JumperOption){
		jumperStoreInternal.set(opt);
	}

	public static unset(){
		jumperStoreInternal.set(null);
	}

}
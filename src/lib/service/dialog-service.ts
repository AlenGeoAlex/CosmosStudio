import { type Readable, readonly, writable, type Writable } from 'svelte/store';
import { type AlertDialogOption } from '$lib/components/shared/commons/models';

const dialogStoreInternal : Writable<Nullable<AlertDialogOption>> = writable(null);
export const activeDialog : Readable<Nullable<AlertDialogOption>> = readonly(dialogStoreInternal);

export class DialogService {

	public static getCurrent() : Nullable<AlertDialogOption> {
		let active : Nullable<AlertDialogOption> = null;
		const unsub = activeDialog.subscribe(x => active = x);
		unsub();
		return active;
	}

	public static create(options : AlertDialogOption) : boolean {
		let allow = false;
		dialogStoreInternal.update(x => {
			if(x !== null){
				allow = false;
				return x;
			}

			allow = true;
			return {
				approveText: options.approveText ?? "Continue",
				cancelText: options.cancelText ?? "Cancel",
				title: options.title,
				descriptions: options.descriptions,
				onApprove: (async () => {
					dialogStoreInternal.set(null);
					if(options.onApprove !== undefined)
						try {
							options.onApprove();
						}catch(e){
							console.log(e)
						}
				}),
				onCancel: (async () => {
					dialogStoreInternal.set(null);
					if(options.onCancel !== undefined)
						try {
							options.onCancel()
						}catch(e){
							console.log(e)
						}
				}),
			}
		})
		return allow;
	}

	public static close() : void {
		dialogStoreInternal.set(null);
	}

}
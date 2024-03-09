import {type Readable, readonly, type Writable, writable} from "svelte/store";
import {type IToastOption, ToastOptions} from "$lib/components/shared/commons/models";
import {ToastType} from "$lib/components/shared/commons/enums";
import { v4 as uuidv4 } from 'uuid';

const toastStore : Writable<ToastOptions[]> = writable([])
export const toast : Readable<ToastOptions[]> = readonly(toastStore);

export class ToastService {
    public static alert(text : string, timeout : number = 5) : string {
        const options : IToastOption = {
            text: text,
            timeout : timeout,
            type: ToastType.Alert,
            color: null
        }

        return this.createInternal(options)
    }

    public static error(text : string, timeout : number = 5) : string {
        const options : IToastOption = {
            text: text,
            timeout : timeout,
            type: ToastType.Error,
            color: null
        }

        return this.createInternal(options)
    }

    public static notification(text : string, timeout : number = 5) : string {
        const options : IToastOption = {
            text: text,
            timeout : timeout,
            type: ToastType.Notification,
            color: null
        }

        return this.createInternal(options)
    }

    public static warning(text : string, timeout : number = 5) : string {
        const options : IToastOption = {
            text: text,
            timeout : timeout,
            type: ToastType.Warning,
            color: null
        }

        return this.createInternal(options)
    }

    public static custom(text : string, timeout : number = 5, color : "green" | "red" | "orange" | "gray" | "yellow" | "blue" | "indigo" | "purple") : string {
        const options : IToastOption = {
            text: text,
            timeout : timeout,
            type: ToastType.Warning,
            color: color
        }

        return this.createInternal(options)
    }

    public static remove(toastId : string | null | undefined){
        if(toastId === null || toastId === undefined)
            return;

        try {
            toastStore.update((current) => {
                const index = current.findIndex(x => x.id == toastId);
                if(index <= 0)
                    return current;

                current = current.slice(index, 1);
                return current;
            })
        }catch (e){
            console.log(e);
        }
    }

    private static createInternal(opt : IToastOption) : string{
        const id = uuidv4();
        const toastOptions = new ToastOptions(id, opt);

        toastStore.update((current) => {
            current.push(toastOptions)
            return current;
        })

        setTimeout(() => {
            this.remove(id);
        }, opt.timeout * 1000)

        return id;
    }
}
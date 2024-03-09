import  {type ToastType} from "$lib/components/shared/commons/enums";

export interface IToastOption {
    text : string
    type : ToastType,
    timeout : number
    color : Nullable<"green" | "red" | "orange" | "gray" | "yellow" | "blue" | "indigo" | "purple" | "none">
}

export class ToastOptions implements IToastOption {
    color: Nullable<"green" | "red" | "orange" | "gray" | "yellow" | "blue" | "indigo" | "purple" | "none"> = null;
    text: string;
    timeout: number;
    type: ToastType;
    id: string


    constructor(id: string, opt : IToastOption) {
        this.id = id;
        this.text = opt.text;
        this.timeout = opt.timeout;
        this.type = opt.type
    }
}

export interface JumperOption {
    text :string | undefined ;
    color: 'primary' | 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'pink' | 'purple' | 'white'
    size? : number,
    shorted? : boolean
}

export interface AlertDialogOption {
    title : string,
    descriptions : string,
    cancelText? : string | undefined,
    approveText? : string | undefined,
    onCancel? : () => Promise<void> | undefined;
    onApprove? : () => Promise<void> | undefined;
}
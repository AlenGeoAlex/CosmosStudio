import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { ErrorResponse } from '@azure/cosmos';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function delay(ms: number, signal : AbortController = new AbortController()): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms, {signal : signal});
    });
}

export function extractCosmosError(cosmosError: ErrorResponse): Nullable<string> {
    let message = cosmosError.body?.message;
    if (!message) {
        return undefined;
    }

    // Attempt to remove potential "Message: " prefix and ActivityId in one step
    const messageWithoutPrefixAndId = message.replace(
      /^Message: .*?(?<=}).*?$/,
      ''
    );
    // Handle cases where the message doesn't follow expected JSON structure
    try {

        const errorObject = JSON.parse(messageWithoutPrefixAndId);
        const errorArray = errorObject?.errors ?? [];
        if (errorArray && errorArray.length > 0) {
            return `[${errorArray[0].code}] - ${errorArray[0].message}`;
        }
    } catch (error) {
        console.debug(`Failed to parse JSON: ${error}`);
    }

    // If parsing fails or no errors are found, return the original message
    return message;
}

type FlyAndScaleParams = {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
};


export class DynamicKey  {

    public static delimiter : string = ":"

    readonly key : string
    readonly prefix : string;
    constructor(key: string, prefix : string = "cstudio:") {
        this.key = key;
        this.prefix = prefix
    }

    public static of(key : string[], prefix? : string): DynamicKey {
        prefix = prefix?.replace("/", ":") ?? `cstudio:`;
        let render = prefix;
        if(!render.endsWith(DynamicKey.delimiter)){
            render += DynamicKey.delimiter;
        }
        for (let k of key) {
            if(k === null || k === undefined || k.length === 0)
                continue;

            k = k.replace("/", DynamicKey.delimiter);
            render+=`${k}${DynamicKey.delimiter}`;
        }
        //Remove the last -
        render = render.slice(0, -1)
        return new DynamicKey(render, prefix);
    }
}

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;

    const scaleConversion = (
        valueA: number,
        scaleA: [number, number],
        scaleB: [number, number]
    ) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        const valueB = percentage * (maxB - minB) + minB;

        return valueB;
    };

    const styleToString = (
        style: Record<string, number | string | undefined>
    ): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, "");
    };

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            });
        },
        easing: cubicOut
    };
};

export async function copyToClipboard(text : string) {
    if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(text);
    } else {
        /**
         * This is the fallback deprecated way of copying text to the clipboard. Only runs if it can't find the clipboard API.
         */
        const element = document.createElement('input');

        element.type = 'text';
        element.disabled = true;

        element.style.setProperty('position', 'fixed');
        element.style.setProperty('z-index', '-100');
        element.style.setProperty('pointer-events', 'none');
        element.style.setProperty('opacity', '0');

        element.value = text;

        document.body.appendChild(element);

        element.click();
        element.select();
        document.execCommand('copy');

        document.body.removeChild(element);
    }
}

export function shorten(input: string | null | undefined, length: number = 10): string {
    if (input === null || input === undefined)
        return "";

    const regex = new RegExp(`(.{${length}})..+`);
    return input.replace(regex, "$1…");
}

export function isNullOrUndefined(ob : any): boolean {
    return ob === null || ob === undefined
}

export function getInvalidDefinitions(ob: Record<string, any>, keys: string[]): string[] {
    const invalid: string[] = [];

    for (const key of keys) {
        if (ob.hasOwnProperty(key) && typeof ob[key] !== 'undefined' && ob[key] !== null) {
            continue;
        }
        invalid.push(key);
    }

    return invalid;
}
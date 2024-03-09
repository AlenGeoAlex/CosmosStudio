import {goto} from "$app/navigation";

export function redirect(pageUrl: string, delay: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            if (delay <= 0) {
                goto(pageUrl);
                resolve();
            } else {
                setTimeout(() => {
                    goto(pageUrl);
                    resolve();
                }, delay);
            }
        } catch (error) {
            reject(error);
        }
    });
}
import { format } from "date-fns";
import { formatRelative } from "date-fns/fp";

export function ticks(){
    return Date.now();
}

export function asDayWeekString(tick: number): string {
    return format(new Date(tick), 'MMMM dd, EEEE');
}

export function asRelative(tick : number) : string {
    return asRelativeFromDate(new Date(tick));
}

export function asRelativeFromDate(date : Date) : string{
    return formatRelative(date, new Date())
}
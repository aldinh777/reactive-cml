import ComponentError from '../error/ComponentError';
import { DEFAULT_COMPONENT_SET } from '../constants';

export function crash(name: string, err: any): ComponentError {
    let reason: string;
    let trace = DEFAULT_COMPONENT_SET.has(name) ? [] : [name];
    if (err instanceof Error) {
        if (err.name === 'ComponentError') {
            trace = trace.concat((err as ComponentError).componentTraces);
            reason = (err as ComponentError).reason;
        } else {
            reason = err.stack;
        }
    } else {
        reason = err || '?';
    }
    return new ComponentError(`Crash at component '${name}'.`, trace, reason);
}

export function has(obj: any, key: string) {
    return typeof obj === 'object' && Reflect.has(obj, key);
}

export function isReactive(item: any) {
    return has(item, 'getValue') && has(item, 'onChange');
}

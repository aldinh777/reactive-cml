import { State } from '@aldinh777/reactive';
import { StateList, StateMap } from '@aldinh777/reactive/collection';
import { Properties, PropAlias } from './types';

export function undupe<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

export function isReactive(item: any) {
    return item instanceof State || item instanceof StateList || item instanceof StateMap;
}

export function statifyObj(obj: Properties, aliases: PropAlias[]): Properties {
    const ob: Properties = Object.assign({}, obj);
    for (const { alias, prop } of aliases) {
        const item = obj[prop];
        if (!isReactive(item)) {
            ob[alias] = new State(obj[prop]);
        }
    }
    return ob;
}

export function cloneObjWithAlias(params: Properties, aliases: PropAlias[], obj: Properties): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const { alias, prop } of aliases) {
        ob[alias] = obj[prop];
    }
    return ob;
}

export function cloneMapWithAlias(params: Properties, aliases: PropAlias[], map: Map<string, any>): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const { alias, prop } of aliases) {
        ob[alias] = map.get(prop);
    }
    return ob;
}

export function cloneObjWithValue(params: Properties, name: string, value: any): Properties {
    const ob: Properties = Object.assign({}, params);
    ob[name] = value;
    return ob;
}

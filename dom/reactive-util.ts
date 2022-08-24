import { State } from '@aldinh777/reactive';
import { StateList, StateMap } from '@aldinh777/reactive/collection';
import { Properties } from '../util';
import { PropAlias } from './dom-util';

export function isReactive(item: any) {
    return item instanceof State || item instanceof StateList || item instanceof StateMap;
}

export function statifyObj(obj: Properties, aliases: PropAlias[]): Properties {
    const ob: Properties = Object.assign({}, obj);
    for (const [alias, prop] of aliases) {
        const item = obj[prop];
        if (!isReactive(item)) {
            ob[alias] = new State(obj[prop]);
        }
    }
    return ob;
}

import { State } from '@aldinh777/reactive';
import { StateCollection } from '@aldinh777/reactive/collection/StateCollection';
import { Properties } from '../util';
import { PropAlias } from './prop-util';

export function isReactive(item: any) {
    return item instanceof State || item instanceof StateCollection;
}

export function statifyObj(obj: Properties, aliases: PropAlias[]): Properties {
    const ob: Properties = Object.assign({}, obj);
    for (const [alias, prop] of aliases) {
        const item = obj[prop];
        if (!isReactive(item)) {
            ob[alias] = new State(item);
        }
    }
    return ob;
}

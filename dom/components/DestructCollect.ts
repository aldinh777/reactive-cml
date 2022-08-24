import { State } from '@aldinh777/reactive';
import { StateMap } from '@aldinh777/reactive/collection';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { PropAlias, propMapClone } from '../dom-util';
import { statifyObj, isReactive } from '../reactive-util';

export default function (props: Properties = {}, _children?: ComponentChildren): NodeComponent[] {
    if (!_children || typeof props.object !== 'string' || typeof props.as !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const obj: any = params[props.object];
    const propnames: PropAlias[] = props.as.split(/\s+/).map((query) => {
        const matches = query.match(/(.+):(.+)/);
        if (matches) {
            const [_, alias, prop] = matches;
            return [alias, prop];
        } else {
            return [query, query];
        }
    });
    if (obj instanceof StateMap) {
        const marker = document.createTextNode('');
        const destructParams = propMapClone(params, propnames, obj.getRawMap());
        const statifiedParams = statifyObj(destructParams, propnames);
        const component: ControlComponent = {
            elems: intoDom(tree, statifiedParams, _super)
        };
        obj.onUpdate((key, value) => {
            const param = statifiedParams[key];
            if (param instanceof State) {
                param.setValue(value);
            } else {
                if (isReactive(value)) {
                    statifiedParams[key] = value;
                } else {
                    statifiedParams[key] = new State(value);
                }
            }
        });
        obj.onDelete((key) => {
            delete statifiedParams[key];
        });
        obj.onInsert((key, value) => {
            if (isReactive(value)) {
                statifiedParams[key] = value;
            } else {
                statifiedParams[key] = new State(value);
            }
        });
        return [component, marker];
    } else {
        throw TypeError(`'${props.object}' are not a valid collection state`);
    }
}

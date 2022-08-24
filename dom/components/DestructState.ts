import { State } from '@aldinh777/reactive';
import {
    ComponentChildren,
    ControlComponent,
    insertItemsBefore,
    intoDom,
    NodeComponent,
    removeItems
} from '..';
import { Properties } from '../../util';
import { PropAlias, propMapClone, propObjClone } from '../dom-util';

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
    if (obj instanceof State) {
        const marker = document.createTextNode('');
        const destructParams =
            obj.getValue() instanceof Map
                ? propMapClone(params, propnames, obj.getValue())
                : propObjClone(params, propnames, obj.getValue());
        const component: ControlComponent = {
            elems: intoDom(tree, destructParams, _super)
        };
        obj.onChange((ob) => {
            const { elems } = component;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            removeItems(parentNode, elems);
            const destructParams =
                ob instanceof Map
                    ? propMapClone(params, propnames, ob)
                    : propObjClone(params, propnames, ob);
            const destructElements = intoDom(tree, destructParams, _super);
            insertItemsBefore(parentNode, marker, destructElements);
            component.elems = destructElements;
        });
        return [component, marker];
    } else {
        throw TypeError(`'${props.object}' are not a valid state`);
    }
}

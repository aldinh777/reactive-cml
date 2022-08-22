import { observe, State } from '@aldinh777/reactive';
import { StateMap } from '@aldinh777/reactive/collection';
import {
    cloneMapWithAlias,
    cloneObjWithAlias,
    isReactive,
    PropAlias,
    Properties,
    statifyObj
} from '../../util';
import {
    ComponentChildren,
    ControlComponent,
    insertItemsBefore,
    intoDom,
    NodeComponent,
    removeItems
} from '..';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] {
    if (
        !_children ||
        typeof props.object !== 'string' ||
        typeof props.as !== 'string'
    ) {
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
        const destructParams =
            obj.getValue() instanceof Map
                ? cloneMapWithAlias(params, propnames, obj.getValue())
                : cloneObjWithAlias(params, propnames, obj.getValue());
        const destructComponent: ControlComponent = {
            elems: intoDom(tree, destructParams, _super),
            marker: document.createTextNode('')
        };
        observe(obj, (ob) => {
            const { elems, marker } = destructComponent;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            removeItems(parentNode, elems);
            const destructParams =
                ob instanceof Map
                    ? cloneMapWithAlias(params, propnames, ob)
                    : cloneObjWithAlias(params, propnames, ob);
            const destructElements = intoDom(tree, destructParams, _super);
            insertItemsBefore(parentNode, marker, destructElements);
            destructComponent.elems = destructElements;
        });
        return [destructComponent];
    } else if (obj instanceof StateMap) {
        const destructMarker = document.createTextNode('');
        const destructParams = cloneMapWithAlias(
            params,
            propnames,
            obj.getRawMap()
        );
        const statifiedParams = statifyObj(destructParams, propnames);
        const destructComponent: ControlComponent = {
            elems: intoDom(tree, statifiedParams, _super),
            marker: destructMarker
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
        return [destructComponent];
    } else {
        const destructParams =
            obj instanceof Map
                ? cloneMapWithAlias(params, propnames, obj)
                : cloneObjWithAlias(params, propnames, obj);
        return intoDom(tree, destructParams, _super);
    }
}

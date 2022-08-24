import { State } from '@aldinh777/reactive';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { cloneSetVal, insertItemsBefore, removeItems } from '../dom-util';

function createFlatListElement(
    params: Properties,
    alias: string,
    items: any[],
    tree: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[] {
    const elems: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = cloneSetVal(params, alias, item);
        elems.push(...intoDom(tree, localParams, cc));
    }
    return elems;
}

export default function (props: Properties = {}, _children?: ComponentChildren): NodeComponent[] {
    if (!_children || typeof props.list !== 'string' || typeof props.as !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    if (list instanceof State) {
        const marker = document.createTextNode('');
        const component: ControlComponent = {
            elems: createFlatListElement(params, alias, list.getValue(), tree, _super)
        };
        list.onChange((items) => {
            const { elems } = component;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            const newListElements: NodeComponent[] = createFlatListElement(
                params,
                alias,
                items,
                tree,
                _super
            );
            removeItems(parentNode, elems);
            insertItemsBefore(parentNode, newListElements, marker);
            component.elems = newListElements;
        });
        return [component, marker];
    } else {
        throw TypeError(`'${props.object}' are not a valid state`);
    }
}

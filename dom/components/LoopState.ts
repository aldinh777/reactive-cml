import { State } from '@aldinh777/reactive/state/State';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import ComponentError from '../../error/ComponentError';
import { propAlias, PropAlias, readAlias } from '../prop-util';

function createFlatListElement(
    params: Properties,
    alias: string,
    destruct: PropAlias[],
    items: any[],
    tree: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[] {
    const elems: NodeComponent[] = [];
    for (const item of items) {
        const localParams = propAlias(params, destruct, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        elems.push(...intoDom(tree, localParams, cc));
    }
    return elems;
}

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.list !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    const destruct: PropAlias[] =
        typeof props.destruct === 'string' ? readAlias(props.destruct) : [];
    if (list instanceof State) {
        const marker = document.createTextNode('');
        const component: ControlComponent = {
            elems: createFlatListElement(params, alias, destruct, list.getValue(), tree, _super)
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
                destruct,
                items,
                tree,
                _super
            );
            remove(parentNode, elems);
            insertBefore(parentNode, newListElements, marker);
            component.elems = newListElements;
        });
        return [component, marker];
    } else {
        throw ComponentError.invalidState(props.list, 'list', 'foreach');
    }
}

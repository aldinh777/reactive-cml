import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, intoDom, ControlComponent } from '..';
import ComponentError from '../../error/ComponentError';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import { PropAlias, propAlias, readAlias } from '../prop-util';

function createFlatListElement(
    params: Properties,
    alias: string,
    destruct: PropAlias[],
    items: any[],
    tree: RCMLResult[],
    cc?: Context
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

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const { tree, params, _super } = context;
    const list = params[props.list];
    const alias = props.as;
    const destruct: PropAlias[] =
        typeof props.destruct === 'string' ? readAlias(props.destruct) : [];
    if (!(list instanceof State)) {
        throw ComponentError.invalidState('LoopState', 'foreach', 'list', props.list);
    }
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
}

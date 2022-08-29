import { State } from '@aldinh777/reactive/state/State';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import { PropAlias, propAlias, readAlias } from '../prop-util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.object !== 'string' || typeof props.as !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const obj: any = params[props.object];
    const propnames: PropAlias[] = readAlias(props.as);
    if (obj instanceof State) {
        const marker = document.createTextNode('');
        const destructParams = propAlias(params, propnames, obj.getValue());
        const component: ControlComponent = {
            elems: intoDom(tree, destructParams, _super)
        };
        obj.onChange((ob) => {
            const { elems } = component;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            remove(parentNode, elems);
            const destructParams = propAlias(params, propnames, obj.getValue());
            const destructElements = intoDom(tree, destructParams, _super);
            insertBefore(parentNode, destructElements, marker);
            component.elems = destructElements;
        });
        return [component, marker];
    } else {
        throw TypeError(`'${props.object}' are not a valid state`);
    }
}

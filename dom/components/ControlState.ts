import { State } from '@aldinh777/reactive/state/State';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { append, remove, insertBefore } from '../dom-util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.condition !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    let condition = _children.params[props.condition];
    if (condition instanceof State) {
        if (props.rev) {
            const rev = new State(!condition.getValue());
            condition.onChange((un) => rev.setValue(!un));
            condition = rev;
        }
        const hide = document.createElement('div');
        const marker = document.createTextNode('');
        const elements = intoDom(tree, params, _super);
        const component: ControlComponent = { elems: [] };
        if (condition.getValue()) {
            component.elems = elements;
        } else {
            append(hide, elements);
        }
        condition.onChange((active: boolean) => {
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            if (active) {
                remove(hide, elements);
                insertBefore(parentNode, elements, marker);
                component.elems = elements;
            } else {
                remove(parentNode, elements);
                append(hide, elements);
                component.elems = [];
            }
        });
        return [component, marker];
    } else {
        throw TypeError(`'${props.conditon}' are not a valid state`);
    }
}

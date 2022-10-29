import { State } from '@aldinh777/reactive';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { append, remove, insertBefore } from '../dom-util';
import ComponentError from '../../error/ComponentError';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.val !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const unless = Reflect.has(props, 'rev');
    let val: State<any> | boolean = params[props.val];
    if (!(val instanceof State)) {
        throw ComponentError.invalidState(
            'ControlState',
            unless ? 'unless' : 'if',
            'val',
            props.val
        );
    }
    const hasEqual = Reflect.has(props, 'equal');
    const value = val.getValue();
    if (hasEqual) {
        const eq = props.equal;
        const equalCond = new State(unless ? value != eq : value == eq);
        if (unless) {
            val.onChange((next) => equalCond.setValue(next != eq));
        } else {
            val.onChange((next) => equalCond.setValue(next == eq));
        }
        val = equalCond;
    } else {
        if (unless) {
            const cond = new State(!value);
            val.onChange((next) => cond.setValue(!next));
            val = cond;
        }
    }
    const hide = document.createElement('div');
    const marker = document.createTextNode('');
    const elements = intoDom(tree, params, _super);
    const component: ControlComponent = { elems: [] };
    if (val.getValue()) {
        component.elems = elements;
    } else {
        append(hide, elements);
    }
    val.onChange((active) => {
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
}

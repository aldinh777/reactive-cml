import { State } from '@aldinh777/reactive';
import { has, isState } from '@aldinh777/reactive-utils/validator';
import { Context, NodeComponent, intoDom, ControlComponent } from '..';
import { _elem, _text, append, remove, mount, dismount } from '../dom-util';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util-type';

export default function (
    props: Properties<any> = {},
    component: Context = {}
): NodeComponent[] | void {
    if (typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const unless = has(props, ['rev']);
    let isActive: State<any> = params[props.value];
    if (!isState(isActive)) {
        throw new ComponentError(
            `'${props.value}' are not a valid State in 'state:value' property of '${
                unless ? 'unless' : 'if'
            }' element`
        );
    }
    const hasEqual = has(props, ['equal']);
    const value = isActive.getValue();
    if (hasEqual) {
        const eq = props.equal;
        const equalCond = new State(unless ? value != eq : value == eq);
        if (unless) {
            isActive.onChange((next) => equalCond.setValue(next != eq));
        } else {
            isActive.onChange((next) => equalCond.setValue(next == eq));
        }
        isActive = equalCond;
    } else if (unless) {
        const cond = new State(!value);
        isActive.onChange((next) => cond.setValue(!next));
        isActive = cond;
    }
    let isMounted = false;
    const hide = _elem('div');
    const marker = _text('');
    const elements = intoDom(children, params, _super);
    const result: ControlComponent = {
        items: [],
        mount: () => (isMounted = true),
        dismount: () => (isMounted = false)
    };
    if (isActive.getValue()) {
        result.items = elements;
    } else {
        append(hide, elements);
    }
    isActive.onChange((active) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        if (active) {
            remove(hide, elements);
            if (isMounted) {
                mount(parentNode, elements, marker);
            } else {
                append(parentNode, elements, marker);
            }
        } else {
            if (isMounted) {
                dismount(parentNode, elements);
            } else {
                remove(parentNode, elements);
            }
            append(hide, elements);
        }
        result.items = active ? elements : [];
    });
    return [result, marker];
}

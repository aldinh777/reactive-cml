import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, intoDom, ControlComponent } from '../dom';
import { isReactive } from '../dom/additional-util';
import { _elem, _text, mount, dismount, append, remove, insertBefore } from '../dom/dom-util';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const unless = Reflect.has(props, 'rev');
    let isActive: State<any> = params[props.value];
    if (!isReactive(isActive)) {
        throw new ComponentError(
            `'${props.value}' are not a valid State in 'state:value' property of '${
                unless ? 'unless' : 'if'
            }' element`
        );
    }
    const hasEqual = Reflect.has(props, 'equal');
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
    const elements = intoDom(children, params, _super, false);
    const component: ControlComponent = {
        items: [],
        mount() {
            isMounted = true;
        },
        dismount() {
            isMounted = false;
        }
    };
    if (isActive.getValue()) {
        component.items = elements;
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
                insertBefore(parentNode, elements, marker);
            }
            component.items = elements;
        } else {
            if (isMounted) {
                dismount(parentNode, elements);
            } else {
                remove(parentNode, elements);
            }
            append(hide, elements);
            component.items = [];
        }
    });
    return [component, marker];
}

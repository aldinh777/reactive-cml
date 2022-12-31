import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, intoDom, ControlComponent } from '../dom';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';
import { append, remove, insertBefore, _elem, _text } from '../dom/dom-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const unless = Reflect.has(props, 'rev');
    let stateValue: State<any> | boolean = params[props.value];
    if (!(stateValue instanceof State)) {
        throw new ComponentError(
            `'${props.value}' are not a valid State in 'state:value' property of '${
                unless ? 'unless' : 'if'
            }' element`
        );
    }
    const hasEqual = Reflect.has(props, 'equal');
    const value = stateValue.getValue();
    if (hasEqual) {
        const eq = props.equal;
        const equalCond = new State(unless ? value != eq : value == eq);
        if (unless) {
            stateValue.onChange((next) => equalCond.setValue(next != eq));
        } else {
            stateValue.onChange((next) => equalCond.setValue(next == eq));
        }
        stateValue = equalCond;
    } else {
        if (unless) {
            const cond = new State(!value);
            stateValue.onChange((next) => cond.setValue(!next));
            stateValue = cond;
        }
    }
    const hide = _elem('div');
    const marker = _text('');
    const elements = intoDom(children, params, _super);
    const component: ControlComponent = { items: [] };
    if (stateValue.getValue()) {
        component.items = elements;
        const mountHandlers = [];
        const dismountHandlers = [];
        for (const elem of elements) {
            if (!(elem instanceof Node)) {
                if (elem.onMount) {
                    mountHandlers.push(elem.onMount);
                }
                if (elem.onDismount) {
                    dismountHandlers.push(elem.onDismount);
                }
            }
        }
        component.onMount = function () {
            for (const mountHandler of mountHandlers) {
                mountHandler();
            }
        };
        component.onDismount = function () {
            for (const dismountHandler of dismountHandlers) {
                dismountHandler();
            }
        };
    } else {
        append(hide, elements, false);
    }
    stateValue.onChange((active) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        if (active) {
            remove(hide, elements, false);
            insertBefore(parentNode, elements, marker);
            component.items = elements;
        } else {
            remove(parentNode, elements);
            append(hide, elements, false);
            component.items = [];
        }
    });
    return [component, marker];
}

import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, intoDom, ControlComponent } from '..';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util';
import { append, remove, insertBefore, _elem, _text } from '../dom-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const unless = Reflect.has(props, 'rev');
    let stateValue: State<any> | boolean = params[props.value];
    if (!(stateValue instanceof State)) {
        throw ComponentError.invalidState(unless ? 'unless' : 'if', 'value', props.value);
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
    const component: ControlComponent = { elems: [] };
    if (stateValue.getValue()) {
        component.elems = elements;
    } else {
        append(hide, elements);
    }
    stateValue.onChange((active) => {
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

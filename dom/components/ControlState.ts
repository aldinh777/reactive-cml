import { State } from '@aldinh777/reactive';
import { has, isState } from '@aldinh777/reactive-utils/validator';
import { RCElement, render } from '../../core/render';
import { Component, RCComponent, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { mount, removeAll, _elem, _text } from '..';
import { generateRandomId, getElementsBetween } from '../../common/helper';

const DATA_MARKER_START = 'data-csx';
const DATA_MARKER_END = 'data-csz';

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
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
        const equalValue = props.equal;
        const equalState = new State(unless ? value != equalValue : value == equalValue);
        if (unless) {
            isActive.onChange((next) => equalState.setValue(next != equalValue));
        } else {
            isActive.onChange((next) => equalState.setValue(next == equalValue));
        }
        isActive = equalState;
    } else if (unless) {
        const condition = new State(!value);
        isActive.onChange((next) => condition.setValue(!next));
        isActive = condition;
    }
    const componentID = generateRandomId(8);
    const childrenComponents = render(children, params, _super);
    let isMounted = false;
    let dismount: () => void;
    let elementStart: Node;
    let elementEnd: Node;
    component.onMount = () => {
        isMounted = true;
        elementStart = document.querySelector(`[${DATA_MARKER_START}="${componentID}"]`);
        elementEnd = document.querySelector(`[${DATA_MARKER_END}="${componentID}"]`);
        if (isActive.getValue()) {
            const parentNode = elementEnd?.parentNode;
            if (!parentNode) {
                return;
            }
            const replaceMarkerStart = _text('');
            const replaceMarkerEnd = _text('');
            parentNode.replaceChild(replaceMarkerStart, elementStart);
            parentNode.replaceChild(replaceMarkerEnd, elementEnd);
            elementStart = replaceMarkerStart;
            elementEnd = replaceMarkerEnd;
            dismount = mount(parentNode, childrenComponents, elementEnd);
        }
    };
    component.onDismount = () => {
        isMounted = false;
        if (isActive.getValue()) {
            dismount?.();
        }
    };
    isActive.onChange((active) => {
        const parentNode = elementEnd?.parentNode;
        if (!parentNode) {
            return;
        }
        if (isMounted) {
            if (active) {
                dismount = mount(parentNode, childrenComponents, elementEnd);
            } else {
                const elements = getElementsBetween(elementStart, elementEnd);
                removeAll(parentNode, elements);
                dismount?.();
            }
        }
    });
    const markerStart = new RCElement('span', { [DATA_MARKER_START]: componentID });
    const markerEnd = new RCElement('span', { [DATA_MARKER_END]: componentID });
    return [markerStart, markerEnd, { items: [], component }];
}

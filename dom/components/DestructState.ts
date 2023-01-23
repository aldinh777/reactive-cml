import { isState } from '@aldinh777/reactive-utils/validator';
import { PropAlias, readAlias, propAlias } from '../../core/prop-util';
import { RCElement, render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { generateRandomId, getElementsBetween } from '../../common/helper';
import { mount, removeAll, _text } from '..';

const DATA_MARKER_START = 'data-dsx';
const DATA_MARKER_END = 'data-dsz';

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    if (!isState<object | Map<string, any>>(obj)) {
        throw new ComponentError(
            `'${props.obj}' are not a valid State in 'state:obj' property of 'destruct' element`
        );
    }
    const componentID = generateRandomId(8);
    let isMounted = false;
    let dismount: () => void;
    let elementStart: Node;
    let elementEnd: Node;
    component.onMount = () => {
        isMounted = true;
        elementStart = document.querySelector(`[${DATA_MARKER_START}="${componentID}"]`);
        elementEnd = document.querySelector(`[${DATA_MARKER_END}="${componentID}"]`);
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
        const destructParams = propAlias(params, propnames, obj.getValue());
        const elements = render(children, destructParams, _super);
        dismount = mount(parentNode, elements, elementEnd);
    };
    component.onDismount = () => {
        isMounted = false;
        dismount?.();
    };
    obj.onChange((ob: Properties<any> | Map<string, any>) => {
        const parentNode = elementEnd?.parentNode;
        if (!parentNode) {
            return;
        }
        if (isMounted) {
            const destructParams = propAlias(params, propnames, ob);
            const oldElements = getElementsBetween(elementStart, elementEnd);
            const newElements = render(children, destructParams, _super);
            removeAll(parentNode, oldElements);
            dismount?.();
            dismount = mount(parentNode, newElements, elementEnd);
        }
    });
    const markerStart = new RCElement('span', { [DATA_MARKER_START]: componentID });
    const markerEnd = new RCElement('span', { [DATA_MARKER_END]: componentID });
    return [markerStart, markerEnd, { items: [], component }];
}

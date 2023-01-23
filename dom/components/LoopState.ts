import { isState } from '@aldinh777/reactive-utils/validator';
import { PropAlias, propAlias, readAlias } from '../../core/prop-util';
import { RCElement, render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { generateRandomId, getElementsBetween } from '../../common/helper';
import { mount, removeAll, _text } from '..';

const DATA_MARKER_START = 'data-lsx';
const DATA_MARKER_END = 'data-lsz';

function createFlatListElement(
    alias: string,
    extract: PropAlias[],
    items: any[],
    component: Component
): RenderResult[] {
    const components: RenderResult[] = [];
    const { children, params, _super } = component;
    for (const item of items) {
        const localParams = propAlias(params, extract, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        components.push(...render(children, localParams, _super));
    }
    return components;
}

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const list = component.params[props.list];
    const alias = props.as;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isState<any[]>(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid State in 'state:list' property of 'foreach' element`
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
        const elements = createFlatListElement(alias, extracts, list.getValue(), component);
        dismount = mount(parentNode, elements, elementEnd);
    };
    component.onDismount = () => {
        isMounted = false;
        dismount?.();
    };
    list.onChange((items: any[]) => {
        const parentNode = elementEnd?.parentNode;
        if (!parentNode) {
            return;
        }
        if (isMounted) {
            const oldElements = getElementsBetween(elementStart, elementEnd);
            const newElements = createFlatListElement(alias, extracts, items, component);
            removeAll(parentNode, oldElements);
            dismount?.();
            dismount = mount(parentNode, newElements, elementEnd);
        }
    });
    const markerStart = new RCElement('span', { [DATA_MARKER_START]: componentID });
    const markerEnd = new RCElement('span', { [DATA_MARKER_END]: componentID });
    return [markerStart, markerEnd, { items: [], component }];
}

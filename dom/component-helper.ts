import { mount } from '.';
import { Component, RenderedComponent, RenderedElement, RenderedResult } from '../core/types';
import { remove, _doc, _text } from './dom-util';

interface MounterOptions {
    preventDismount?(): boolean;
    onMount?(): void | Function | Promise<void | Function>;
}

export interface MounterData {
    marker: {
        start?: Node;
        end?: Node;
    };
    rendered: [start: RenderedElement, end: RenderedElement, component: RenderedComponent];
    mount(components: RenderedResult[]): Promise<void>;
    dismount(): Promise<void>;
}

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomId(length: number): string {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    return id;
}

export function getElementsBetween(startNode: Node, endNode: Node): Node[] {
    const elements: Node[] = [];
    let currentNode = startNode;
    while (currentNode.nextSibling !== endNode) {
        currentNode = currentNode.nextSibling;
        elements.push(currentNode);
    }
    return elements;
}

export function createMounter(
    markerID: string,
    component: Component,
    options: MounterOptions = {}
): MounterData {
    const COMPONENT_ID = generateRandomId(8);
    const NAMESPACE_START = `data-${markerID}x`;
    const NAMESPACE_END = `data-${markerID}z`;
    let dismount: () => any;
    const mounter: MounterData = {
        marker: {},
        rendered: [
            { tag: 'span', props: { [NAMESPACE_START]: COMPONENT_ID }, events: {}, children: [] },
            { tag: 'span', props: { [NAMESPACE_END]: COMPONENT_ID }, events: {}, children: [] },
            { items: [], component }
        ],
        async mount(components: RenderedResult[]) {
            const endMarker = mounter.marker.end;
            const parent = endMarker?.parentNode;
            dismount = await mount(parent, components, endMarker);
        },
        async dismount() {
            dismount?.();
            const { start, end } = mounter.marker;
            const parent = end?.parentNode;
            if (start && end) {
                const elements = getElementsBetween(start, end);
                remove(parent, elements);
            }
        }
    };
    component.onMount = async () => {
        const elementStart = _doc.querySelector(`[${NAMESPACE_START}="${COMPONENT_ID}"]`);
        const elementEnd = _doc.querySelector(`[${NAMESPACE_END}="${COMPONENT_ID}"]`);
        const parentNode = elementEnd?.parentNode;
        if (!parentNode) {
            return;
        }
        const replaceMarkerStart = _text('');
        const replaceMarkerEnd = _text('');
        parentNode.replaceChild(replaceMarkerStart, elementStart);
        parentNode.replaceChild(replaceMarkerEnd, elementEnd);
        mounter.marker.start = replaceMarkerStart;
        mounter.marker.end = replaceMarkerEnd;
        const onDismount = await options.onMount?.();
        return async () => {
            if (onDismount) {
                await onDismount();
            }
            if (!options.preventDismount?.()) {
                await mounter.dismount();
            }
            dismount = null;
        };
    };
    return mounter;
}

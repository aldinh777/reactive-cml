import { mount } from '.';
import { RCElement } from '../core/element';
import { Component, RCComponent, RenderResult } from '../core/types';
import { removeAll, _doc, _text } from './dom-util';

interface MounterOptions {
    preventDismount?(): boolean;
    onMount?(): any;
    onDismount?(): any;
}

export interface MounterData {
    marker: {
        start?: Node;
        end?: Node;
    };
    rendered: [start: RCElement, end: RCElement, component: RCComponent];
    mount(components: RenderResult[]): void;
    dismount(): void;
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
            new RCElement('span', { [NAMESPACE_START]: COMPONENT_ID }),
            new RCElement('span', { [NAMESPACE_END]: COMPONENT_ID }),
            { items: [], component }
        ],
        mount(components: RenderResult[]) {
            const endMarker = mounter.marker.end;
            const parent = endMarker?.parentNode;
            dismount = mount(parent, components, endMarker);
        },
        dismount() {
            dismount?.();
            const { start, end } = mounter.marker;
            const parent = end?.parentNode;
            if (start && end) {
                const elements = getElementsBetween(start, end);
                removeAll(parent, elements);
            }
        }
    };
    component.onMount = () => {
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
        options.onMount?.();
    };
    component.onDismount = () => {
        if (!options.preventDismount?.()) {
            mounter.dismount?.();
        }
        dismount = null;
        options.onDismount?.();
    };
    return mounter;
}

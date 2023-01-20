import { isState } from '@aldinh777/reactive-utils/validator';
import { RCElement } from '../core/render';
import { RenderResult } from '../core/types';

export const _doc = document;
export const _text = (text: any) => _doc.createTextNode(text);
export const _elem = (tag: string) => _doc.createElement(tag);

export const append = (target: Node, elem: Node, before?: Node) => {
    if (before) {
        target.insertBefore(elem, before);
    } else {
        target.appendChild(elem);
    }
};

export const setAttr = (element: Element, attribute: string, value: any) => {
    if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
    } else {
        const att = _doc.createAttribute(attribute);
        att.value = value;
        element.setAttributeNode(att);
    }
};

export function toDom(rcElement: RCElement): Element {
    const domElement = _elem(rcElement.tag);
    for (const prop in rcElement.props) {
        const propvalue = rcElement.props[prop];
        if (isState(propvalue)) {
            setAttr(domElement, prop, propvalue.getValue());
            propvalue.onChange((nextvalue) => setAttr(domElement, prop, nextvalue));
        } else {
            setAttr(domElement, prop, propvalue);
        }
    }
    for (const event in rcElement.events) {
        const listener = rcElement.events[event] as EventListener;
        domElement.addEventListener(event, listener);
    }
    for (const child of rcElement.children) {
        if (typeof child === 'string') {
            append(domElement, _text(child));
        } else if (isState(child)) {
            const textNode = _text(child.getValue());
            child.onChange((text) => (textNode.textContent = String(text)));
            append(domElement, textNode);
        } else {
            append(domElement, toDom(child));
        }
    }
    return domElement;
}

export function mount(target: Node, components: RenderResult[], before?: Node) {
    for (const item of components) {
        if (typeof item === 'string') {
            append(target, _text(item), before);
        } else if (isState(item)) {
            const textNode = _text(item.getValue());
            item.onChange((text) => (textNode.textContent = String(text)));
            append(target, textNode, before);
        } else if (item instanceof RCElement) {
            append(target, toDom(item), before);
        } else {
            const parent = (item.root && toDom(item.root)) || target;
            if (parent !== target) {
                append(target, parent, before);
            }
            if (item?.component?.onMount) {
                item.component.onMount();
            }
            mount(parent, item.items);
        }
    }
}

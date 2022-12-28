import { NodeComponent } from '.';
import { RCResult, Component } from '../src';

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

function _r(handler: (par: Node, item: Node, bef?: Node) => any) {
    return function recurse(parent: Node, items: NodeComponent[], before?: Node) {
        for (const item of items) {
            if (item instanceof Node) {
                handler(parent, item, before);
            } else {
                recurse(parent, item.elems, before);
            }
        }
    };
}

export const append = _r((par, item) => par.appendChild(item));
export const remove = _r((par, item) => par.removeChild(item));
export const insertBefore = _r((par, item, bef) => par.insertBefore(item, bef as Node));

export function setAttr(elem: HTMLElement, attr: string, value: any) {
    if (elem.hasAttribute(attr)) {
        elem.setAttribute(attr, value);
        return;
    }
    const att = _doc.createAttribute(attr);
    att.value = value;
    elem.setAttributeNode(att);
}

export function simpleDom(tree: RCResult[]): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
            continue;
        }
        const [tag, props, , children] = item as Component;
        const elem = _elem(tag);
        for (const prop in props) {
            const value = props[prop];
            setAttr(elem, prop, value);
        }
        append(elem, simpleDom(children));
        result.push(elem);
    }
    return result;
}

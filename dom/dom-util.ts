import { NodeComponent } from '.';
import { RCMLResult, Component } from '../src';

function recursiveNodes(handler: (par: Node, item: Node, bef?: Node) => any) {
    return function recurse(parent: Node, items: NodeComponent[], before?: Node) {
        for (const item of items) {
            if (item instanceof Node) {
                handler(parent, item, before);
            } else {
                recurse(parent, item.elems, before);
            }
        }
    }
}

export const append = recursiveNodes((par, item) => par.appendChild(item));
export const remove = recursiveNodes((par, item) => par.removeChild(item));
export const insertBefore = recursiveNodes((par, item, bef) => par.insertBefore(item, bef as Node));

export function setAttr(elem: HTMLElement, attr: string, value: any) {
    if (elem.hasAttribute(attr)) {
        elem.setAttribute(attr, value);
    } else {
        const att = document.createAttribute(attr);
        att.value = value;
        elem.setAttributeNode(att);
    }
}

export function simpleDom(tree: RCMLResult[]): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(document.createTextNode(item));
        } else {
            const { tag, props, children } = item as Component;
            const elem = document.createElement(tag);
            for (const prop in props) {
                const value = props[prop];
                setAttr(elem, prop, value);
            }
            append(elem, simpleDom(children));
            result.push(elem);
        }
    }
    return result;
}

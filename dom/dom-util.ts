import { Context, NodeComponent } from '.';
import { RCResult, Component } from '../src';

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

export function mount(target: null | Node, components: NodeComponent[], nodeBefore?: Node) {
    if (target) {
        if (nodeBefore) {
            insertBefore(target, components, nodeBefore);
        } else {
            append(target, components);
        }
    }
    for (const component of components) {
        if (!(component instanceof Node)) {
            if (component.mount) {
                component.mount();
            }
            mount(null, component.items);
        }
    }
}

export function dismount(target: null | Node, components: NodeComponent[]) {
    if (target) {
        remove(target, components);
    }
    for (const component of components) {
        if (!(component instanceof Node)) {
            if (component.dismount) {
                component.dismount();
            }
            dismount(null, component.items);
        }
    }
}

export function append(parentNode: Node, components: NodeComponent[]) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.appendChild(component);
        } else if (component.root) {
            parentNode.appendChild(component.root);
        } else {
            append(parentNode, component.items);
        }
    }
}

export function remove(parentNode: Node, components: NodeComponent[]) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.removeChild(component);
        } else if (component.root) {
            parentNode.removeChild(component.root);
        } else {
            remove(parentNode, component.items);
        }
    }
}

export function insertBefore(parentNode: Node, components: NodeComponent[], nodeBefore: Node) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.insertBefore(component, nodeBefore);
        } else if (component.root) {
            parentNode.insertBefore(component.root, nodeBefore);
        } else {
            insertBefore(parentNode, component.items, nodeBefore);
        }
    }
}

export function setAttr(element: HTMLElement, attribute: string, value: any) {
    if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
        return;
    }
    const att = _doc.createAttribute(attribute);
    att.value = value;
    element.setAttributeNode(att);
}

export function simpleDom(tree: RCResult[], component?: Context): NodeComponent[] {
    const result: NodeComponent[] = [];
    const onMount = component?.onMount;
    const onDismount = component?.onDismount;
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
    return onMount || onDismount
        ? [{ items: result, mount: onMount, dismount: onDismount }]
        : result;
}

import { Context, NodeComponent } from '.';
import { RCResult, Component } from '../src';

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

export function append(parentNode: Node, components: NodeComponent[], runMounter = true) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.appendChild(component);
            continue;
        }
        append(component.root || parentNode, component.items, runMounter);
        if (component.root) {
            parentNode.appendChild(component.root);
        }
        if (runMounter && component.mount) {
            component.mount();
        }
    }
}

export function remove(parentNode: Node, components: NodeComponent[], runDismounter = true) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.removeChild(component);
            continue;
        }
        remove(parentNode || component.root, component.items, runDismounter);
        if (component.root) {
            parentNode.removeChild(component.root);
        }
        if (runDismounter && component.dismount) {
            component.dismount();
        }
    }
}

export function insertBefore(
    parentNode: Node,
    components: NodeComponent[],
    nodeBefore: Node,
    runMounter = true
) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.insertBefore(component, nodeBefore);
            continue;
        }
        insertBefore(parentNode, component.items, nodeBefore, runMounter);
        if (component.root) {
            parentNode.insertBefore(component.root, nodeBefore);
        }
        if (runMounter && component.mount) {
            component.mount();
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
        append(elem, simpleDom(children), false);
        result.push(elem);
    }
    return onMount || onDismount
        ? [{ items: result, mount: onMount, dismount: onDismount }]
        : result;
}

import { Context, NodeComponent } from '.';
import { RCResult, Component } from '../src';

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

export function append(parentNode: Node, components: NodeComponent[], runMountHandler = true) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.appendChild(component);
            continue;
        }
        append(parentNode, component.items, runMountHandler);
        if (component.onMount && runMountHandler) {
            component.onMount();
        }
    }
}

export function remove(parentNode: Node, components: NodeComponent[], runDismountHandler = true) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.removeChild(component);
            continue;
        }
        remove(parentNode, component.items, runDismountHandler);
        if (component.onDismount && runDismountHandler) {
            component.onDismount();
        }
    }
}

export function insertBefore(
    parentNode: Node,
    components: NodeComponent[],
    nodeBefore: Node,
    runMountHandler = true
) {
    for (const component of components) {
        if (component instanceof Node) {
            parentNode.insertBefore(component, nodeBefore);
            continue;
        }
        insertBefore(parentNode, component.items, nodeBefore, runMountHandler);
        if (component.onMount && runMountHandler) {
            component.onMount();
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

export function simpleDom(tree: RCResult[], context?: Context): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
            continue;
        }
        const [tag, props, , children] = item as Component;
        const elem = _elem(tag);
        const temp = { mount: context?.onMount, dismount: context?.onDismount };
        delete context?.onMount;
        delete context?.onDismount;
        for (const prop in props) {
            const value = props[prop];
            setAttr(elem, prop, value);
        }
        append(elem, simpleDom(children));
        if (context) {
            context.onMount = temp.mount;
            context.onDismount = temp.dismount;
        }
        result.push(elem);
    }
    return context?.onMount || context?.onDismount
        ? [{ items: result, onMount: context?.onMount, onDismount: context?.onDismount }]
        : result;
}

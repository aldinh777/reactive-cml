import { Context, NodeComponent } from '.';
import { RCResult, Component } from '../src';

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

function _r(handler: (parentNode: Node, item: Node, nodeBefore?: Node) => any) {
    return function recurse(parent: Node, components: NodeComponent[], before?: Node) {
        for (const component of components) {
            if (component instanceof Node) {
                handler(parent, component, before);
            } else {
                recurse(parent, component.items, before);
            }
        }
    };
}

export const append = _r((parentNode, item) => parentNode.appendChild(item));
export const remove = _r((parentNode, item) => parentNode.removeChild(item));
export const insertBefore = _r((parentNode, item, nodeBefore) =>
    parentNode.insertBefore(item, nodeBefore as Node)
);

export function setAttr(element: HTMLElement, attribute: string, value: any) {
    if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
        return;
    }
    const att = _doc.createAttribute(attribute);
    att.value = value;
    element.setAttributeNode(att);
}

export function prepareLifecycle(result: NodeComponent[], context?: Context): NodeComponent {
    const mountHandler = context?.onMount;
    const dismountHandler = context?.onDismount;
    const onMount = context?.lifecycle?.onMount || [];
    const onDismount = context?.lifecycle?.onDismount || [];
    return {
        items: result,
        onMount: mountHandler ? [...onMount, mountHandler] : onMount,
        onDismount: dismountHandler ? [...onDismount, dismountHandler] : onDismount
    };
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
        for (const prop in props) {
            const value = props[prop];
            setAttr(elem, prop, value);
        }
        append(elem, simpleDom(children));
        result.push(elem);
    }
    return context?.onMount || context?.onDismount ? [prepareLifecycle(result, context)] : result;
}

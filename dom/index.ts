import { StateSubscription } from '@aldinh777/reactive';
import { isState } from '@aldinh777/reactive-utils/validator';
import { RCElement } from '../core/render';
import { RenderResult } from '../core/types';

export const _doc = document;
export const _text = (text: any) => _doc.createTextNode(text);
export const _elem = (tag: string) => _doc.createElement(tag);

export const append = (parent: Node, node: Node, before?: Node): void => {
    if (before) {
        parent.insertBefore(node, before);
    } else {
        parent.appendChild(node);
    }
};
export const removeAll = (parent: Node, nodes: Node[]): void => {
    for (const node of nodes) {
        parent.removeChild(node);
    }
};

export const setAttr = (element: Element, attribute: string, value: any): void => {
    if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
    } else {
        const att = _doc.createAttribute(attribute);
        att.value = value;
        element.setAttributeNode(att);
    }
};

type DomBindingOutput = [element: Element, bindings: StateSubscription<any>[]];

export function toDom(rcElement: RCElement): DomBindingOutput {
    const bindings: StateSubscription<any>[] = [];
    const domElement = _elem(rcElement.tag);
    for (const propname in rcElement.props) {
        const propvalue = rcElement.props[propname];
        if (isState(propvalue)) {
            setAttr(domElement, propname, propvalue.getValue());
            const sub = propvalue.onChange((nextvalue) => setAttr(domElement, propname, nextvalue));
            bindings.push(sub);
        } else {
            setAttr(domElement, propname, propvalue);
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
            const sub = child.onChange((text) => (textNode.textContent = String(text)));
            bindings.push(sub);
            append(domElement, textNode);
        } else {
            const [element, nestedBindings] = toDom(child);
            append(domElement, element);
            bindings.push(...nestedBindings);
        }
    }
    return [domElement, bindings];
}

export function mount(parent: Node, components: RenderResult[], before?: Node): () => void {
    const bindings: StateSubscription<any>[] = [];
    const dismounters: (() => void)[] = [];
    for (const item of components) {
        if (typeof item === 'string') {
            append(parent, _text(item), before);
        } else if (isState(item)) {
            const textNode = _text(item.getValue());
            const sub = item.onChange((text) => (textNode.textContent = String(text)));
            bindings.push(sub);
            append(parent, textNode, before);
        } else if (item instanceof RCElement) {
            const [element, nestedBindings] = toDom(item);
            append(parent, element, before);
            bindings.push(...nestedBindings);
        } else {
            let nextParent = parent;
            if (item.root) {
                const [element, nestedBindings] = toDom(item.root);
                nextParent = element;
                bindings.push(...nestedBindings);
            }
            const isEqualParent = parent === nextParent;
            if (!isEqualParent) {
                append(parent, nextParent, before);
            }
            const dismount = mount(nextParent, item.items, isEqualParent ? before : undefined);
            dismounters.push(dismount);
            if (item?.component?.onMount) {
                item.component.onMount();
            }
            if (item?.component?.onDismount) {
                dismounters.push(item.component.onDismount);
            }
        }
    }
    return () => {
        for (const binding of bindings) {
            binding.unsub();
        }
        for (const dismount of dismounters) {
            dismount();
        }
    };
}

import { isState } from '@aldinh777/reactive-utils/validator';
import { has } from '@aldinh777/toolbox/object/validate';
import { RenderedElement, RenderedResult } from '../core/types';
import { _elem, setAttr, append, _text } from './dom-util';

type DomBindingOutput = [element: Element, bindings: (() => any)[]];

export function toDom(element: RenderedElement): DomBindingOutput {
    const dismounters: (() => any)[] = [];
    const domElement = _elem(element.tag);
    for (const propname in element.props) {
        const propvalue = element.props[propname];
        if (isState(propvalue)) {
            setAttr(domElement, propname, propvalue.getValue());
            const sub = propvalue.onChange((nextvalue) => setAttr(domElement, propname, nextvalue));
            dismounters.push(() => sub.unsub());
        } else {
            setAttr(domElement, propname, propvalue);
        }
    }
    for (const event in element.events) {
        const listener = element.events[event] as EventListener;
        domElement.addEventListener(event, listener);
        dismounters.push(() => domElement.removeEventListener(event, listener));
    }
    for (const child of element.children) {
        if (typeof child === 'string') {
            append(domElement, [_text(child)]);
        } else if (isState(child)) {
            const textNode = _text(child.getValue());
            const sub = child.onChange((text) => (textNode.textContent = String(text)));
            dismounters.push(() => sub.unsub());
            append(domElement, [textNode]);
        } else {
            const [element, nestedDismounters] = toDom(child);
            append(domElement, [element]);
            dismounters.push(...nestedDismounters);
        }
    }
    return [domElement, dismounters];
}

const isElement = (elem: any): elem is RenderedElement =>
    has(elem, 'tag', 'props', 'events', 'children');

export async function mount(
    parent: Node,
    components: RenderedResult[],
    before?: Node
): Promise<Function> {
    const dismounters: Function[] = [];
    for (const item of components) {
        if (typeof item === 'string') {
            append(parent, [_text(item)], before);
        } else if (isState(item)) {
            const textNode = _text(item.getValue());
            const sub = item.onChange((text) => (textNode.textContent = String(text)));
            dismounters.push(() => sub.unsub());
            append(parent, [textNode], before);
        } else if (isElement(item)) {
            const [element, domDismounters] = toDom(item);
            append(parent, [element], before);
            dismounters.push(...domDismounters);
        } else {
            let nextParent = parent;
            if (item.root) {
                const [element, nestedDismounters] = toDom(item.root);
                nextParent = element;
                dismounters.push(...nestedDismounters);
            }
            const isEqualParent = parent === nextParent;
            if (!isEqualParent) {
                append(parent, [nextParent], before);
            }
            const dismount = await mount(
                nextParent,
                item.items,
                isEqualParent ? before : undefined
            );
            dismounters.push(dismount);
            if (item?.component?.onMount) {
                const onDismount = await item.component.onMount();
                if (onDismount) {
                    dismounters.push(onDismount);
                }
            }
        }
    }
    return () => {
        for (const dismount of dismounters) {
            dismount();
        }
    };
}

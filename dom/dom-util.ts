import { Context, NodeComponent } from '.';
import { RCResult, RCFlatElement } from '../src/types';

type ComponentHandler = (target: Node, components: NodeComponent[], nodeBefore: Node) => void;

export const _doc: Document = document;

export const _text = (text: string): Text => _doc.createTextNode(text);
export const _elem = (tag: string): HTMLElement => _doc.createElement(tag);

const _rec = (nodeHandler: (parent: Node, item: Node, nodeBefore?: Node) => void) => {
    const recurse = (parentNode: Node, components: NodeComponent[], nodeBefore?: Node) => {
        for (const component of components) {
            const isNode = component instanceof Node;
            const item = isNode ? component : component.root;
            if (isNode || item) {
                nodeHandler(parentNode, item, nodeBefore);
            } else {
                recurse(parentNode, component.items, nodeBefore);
            }
        }
    };
    return recurse;
};
export const append = _rec((parentNode, item, nodeBefore) => {
    if (nodeBefore) {
        parentNode.insertBefore(item, nodeBefore);
    } else {
        parentNode.appendChild(item);
    }
});
export const remove = _rec((parentNode, item) => parentNode.removeChild(item));

const _recMount = (executor: ComponentHandler, caller: string) => {
    const recurseMount = (target: null | Node, components: NodeComponent[], nodeBefore?: Node) => {
        if (target) {
            executor(target, components, nodeBefore);
        }
        for (const component of components) {
            if (!(component instanceof Node)) {
                component[caller]?.();
                recurseMount(null, component.items);
            }
        }
    };
    return recurseMount;
};
export const mount = _recMount(append, 'mount');
export const dismount = _recMount(remove, 'dismount');

export const setAttr = (element: HTMLElement, attribute: string, value: any) => {
    if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
    } else {
        const att = _doc.createAttribute(attribute);
        att.value = value;
        element.setAttributeNode(att);
    }
};

export function simpleDom(tree: RCResult[], component?: Context): NodeComponent[] {
    const result: NodeComponent[] = [];
    const onMount = component?.onMount;
    const onDismount = component?.onDismount;
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(_text(item));
        } else {
            const [tag, props, , children] = item as RCFlatElement;
            const elem = _elem(tag);
            for (const prop in props) {
                const value = props[prop];
                setAttr(elem, prop, value);
            }
            append(elem, simpleDom(children));
            result.push(elem);
        }
    }
    return onMount || onDismount
        ? [{ items: result, mount: onMount, dismount: onDismount }]
        : result;
}

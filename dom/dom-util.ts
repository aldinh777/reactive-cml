import { NodeComponent } from '.';
import { RCMLResult, Component } from '../src';
import { Properties, TextProp } from '../util';

export type PropAlias = string[];

export function propAlias(
    params: Properties,
    aliases: PropAlias[],
    obj: Properties | Map<string, any>
): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const [alias, prop] of aliases) {
        ob[alias] = obj instanceof Map ? obj.get(prop) : obj[prop];
    }
    return ob;
}

export function cloneSetVal(params: Properties, name: string, value: any): Properties {
    return Object.assign({}, params, { [name]: value });
}

function recursiveControl(handler: (par: Node, item: Node, bef?: Node) => any) {
    function recurse(parent: Node, items: NodeComponent[], before?: Node) {
        for (const item of items) {
            if (item instanceof Node) {
                handler(parent, item, before);
            } else {
                recurse(parent, item.elems, before);
            }
        }
    }
    return recurse;
}

export const appendItems = recursiveControl((par, item) => par.appendChild(item));
export const removeItems = recursiveControl((par, item) => par.removeChild(item));
export const insertItemsBefore = recursiveControl((par, item, bef) => par.insertBefore(item, bef as Node));

export function setElementAttribute(elem: HTMLElement, attr: string, value: any) {
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
        } else if (Reflect.has(item, 'name')) {
            result.push(document.createTextNode(`{${(item as TextProp).name}}`));
        } else {
            const { tag, props, children } = item as Component;
            const elem = document.createElement(tag);
            for (const prop in props) {
                const value = props[prop];
                setElementAttribute(elem, prop, value);
            }
            appendItems(elem, simpleDom(children));
            result.push(elem);
        }
    }
    return result;
}

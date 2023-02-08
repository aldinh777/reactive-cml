import { has } from '@aldinh777/toolbox/object/validate';
import { RenderedComponent, RenderedElement, RenderedResult } from '../../core/types';
import { append, setAttr, _elem, _text } from '../dom-util';

function simpleToDom(element: RenderedElement): Node {
    const domElement = _elem(element.tag);
    for (const propname in element.props) {
        const propvalue = element.props[propname];
        setAttr(domElement, propname, propvalue);
    }
    for (const child of element.children as (RenderedElement | string)[]) {
        if (typeof child === 'string') {
            append(domElement, [_text(child)]);
        } else {
            const element = simpleToDom(child);
            append(domElement, [element]);
        }
    }
    return domElement;
}

const isElement = (item: any): item is RenderedElement => has(item, 'children');

export function simpleMount(parent: Node, components: RenderedResult[], before?: Node): void {
    for (const item of components as (RenderedComponent | RenderedElement | string)[]) {
        if (typeof item === 'string') {
            append(parent, [_text(item)], before);
        } else if (isElement(item)) {
            const element = simpleToDom(item);
            append(parent, [element], before);
        } else {
            simpleMount(parent, item.items, before);
            if (item?.component?.onMount) {
                item.component.onMount();
            }
        }
    }
}

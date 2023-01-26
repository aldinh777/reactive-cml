import { RCElement } from '../../core/element';
import { RenderResult } from '../../core/types';
import { append, setAttr, _elem, _text } from '../dom-util';

export function simpleToDom(rcElement: RCElement): Node {
    const domElement = _elem(rcElement.tag);
    for (const propname in rcElement.props) {
        const propvalue = rcElement.props[propname];
        setAttr(domElement, propname, propvalue);
    }
    for (const child of rcElement.children as (RCElement | string)[]) {
        if (typeof child === 'string') {
            append(domElement, [_text(child)]);
        } else {
            const element = simpleToDom(child);
            append(domElement, [element]);
        }
    }
    return domElement;
}

export function simpleMount(parent: Node, components: RenderResult[], before?: Node): void {
    for (const item of components as (RCElement | string)[]) {
        if (typeof item === 'string') {
            append(parent, [_text(item)], before);
        } else {
            const element = simpleToDom(item);
            append(parent, [element], before);
        }
    }
}

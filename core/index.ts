import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps } from './util';
import { FlatElement, Properties, FlatText, FlatResult } from './types';

function processComponent(node: CMLObject): FlatElement {
    const { tag, props, children } = node;
    const propsComp: Properties<string | FlatText> = {};
    const eventsComp: Properties<string> = {};
    for (const prop in props) {
        const value = props[prop];
        const matches = prop.match(/(on|bind):(.+)/);
        if (!matches) {
            propsComp[prop] = value;
            continue;
        }
        const [, type, attr] = matches;
        if (type === 'bind') {
            propsComp[attr] = [value];
        } else {
            eventsComp[attr] = value;
        }
    }
    return [tag, propsComp, eventsComp, renderCML(children)];
}

export function renderCML(tree: CMLTree): FlatResult[] {
    const result: FlatResult[] = [];
    for (const node of tree) {
        if (typeof node === 'string') {
            result.push(...extractTextProps(node));
        } else {
            result.push(processComponent(node));
        }
    }
    return result;
}

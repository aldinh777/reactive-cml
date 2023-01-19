import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps } from '../util';
import { Properties, TextProp } from '../util-type';

export type RCResult = string | TextProp | Component;

export type Component = [
    tag: string,
    props: Properties<string | TextProp>,
    events: Properties<string>,
    children: RCResult[]
];

function processComponent(node: CMLObject): Component {
    const { tag, props, children } = node;
    const propsComp: Properties<string | TextProp> = {};
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
    return [tag, propsComp, eventsComp, processRC(children)];
}

export function processRC(tree: CMLTree): RCResult[] {
    const result: RCResult[] = [];
    for (const node of tree) {
        if (typeof node === 'string') {
            result.push(...extractTextProps(node));
        } else {
            result.push(processComponent(node));
        }
    }
    return result;
}

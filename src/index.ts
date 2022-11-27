import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps, StaticProperties, TextProp } from '../util';

export type RCResult = string | TextProp | Component;

export type Component = [
    tag: string,
    props: StaticProperties<string | TextProp>,
    events: StaticProperties<string>,
    children: RCResult[]
];

function processComponent(node: CMLObject): Component {
    const { tag, props, children } = node;
    const propsComp: StaticProperties<string | TextProp> = {};
    const eventsComp: StaticProperties<string> = {};
    for (const prop in props) {
        const value = props[prop];
        const matches = prop.match(/(on|bind):(.+)/);
        if (matches) {
            const [, type, attr] = matches;
            if (type === 'bind') {
                propsComp[attr] = { name: value };
            } else {
                eventsComp[attr] = value;
            }
        } else {
            propsComp[prop] = value;
        }
    }
    const comp: Component = [tag, propsComp, eventsComp, processRC(children)];
    return comp;
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

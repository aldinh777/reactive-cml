import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import {
    extractTextProps,
    StaticProperties,
    TextProp
} from '../util';

type RCMLResult = string | TextProp | Component;

interface Component {
    tag: string;
    props: StaticProperties<string | TextProp>;
    events: StaticProperties<Function | TextProp>;
    children: RCMLResult[];
}

function processComponent(node: CMLObject): Component {
    const { tag, props, children } = node;
    const propsComp: StaticProperties<string | TextProp> = {};
    const eventsComp: StaticProperties<Function | TextProp> = {};
    for (const prop in props) {
        const value = props[prop];
        const matches = prop.match(/(on|bind):(.+)/);
        if (matches) {
            const [, type, attr] = matches;
            switch (type) {
                case 'bind':
                    propsComp[attr] = { name: value };
                    break;
                case 'on':
                    eventsComp[attr] = { name: value };
                    break;
            }
        } else {
            propsComp[prop] = value;
        }
    }
    return {
        tag: tag,
        props: propsComp,
        events: eventsComp,
        children: processRCML(children)
    };
}

function extractSpecifics(node: CMLObject, extracts: string[]): Component {
    const { tag, props, children } = node;
    const propsComp: StaticProperties<TextProp> = {};
    for (const extract of extracts) {
        propsComp[extract] = { name: props[extract] };
    }
    return {
        tag: tag,
        props: propsComp,
        events: {},
        children: processRCML(children)
    };
}

export function processRCML(tree: CMLTree): RCMLResult[] {
    const result: RCMLResult[] = [];
    for (const node of tree) {
        if (typeof node === 'string') {
            result.push(...extractTextProps(node));
        } else {
            switch (node.tag) {
                case 'if':
                case 'unless':
                    result.push(extractSpecifics(node, ['condition']));
                    break;
                case 'foreach':
                    result.push(extractSpecifics(node, ['list', 'as']));
                    break;
                case 'destruct':
                    result.push(extractSpecifics(node, ['object', 'as']));
                    break;
                default:
                    result.push(processComponent(node));
                    break;
            }
        }
    }
    return result;
}

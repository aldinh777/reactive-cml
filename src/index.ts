import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import {
    extractTextProps,
    StaticProperties,
    TextProp
} from '../util';

export type RCMLResult = string | TextProp | Component;

export interface Component {
    tag: string;
    props: StaticProperties<string | TextProp>;
    events: StaticProperties<string>;
    children: RCMLResult[];
}

function processComponent(node: CMLObject): Component {
    const { tag, props, children } = node;
    const propsComp: StaticProperties<string | TextProp> = {};
    const eventsComp: StaticProperties<string> = {};
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
                    eventsComp[attr] = value;
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
    const propsComp: StaticProperties<string> = {};
    for (const extract of extracts) {
        propsComp[extract] = props[extract];
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

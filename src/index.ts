import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps, StaticProperties, TextProp } from '../util';

export type RCMLResult = string | TextProp | Component;

export interface Component {
    tag: string;
    props?: StaticProperties<string | TextProp>;
    events?: StaticProperties<string>;
    children: RCMLResult[];
}

function processComponent(node: CMLObject): Component {
    const { tag, props, children } = node;
    const propsComp: StaticProperties<string | TextProp> = {};
    const eventsComp: StaticProperties<string> = {};
    let trimProps = true;
    let trimEvents = true;
    for (const prop in props) {
        const value = props[prop];
        const matches = prop.match(/(on|bind):(.+)/);
        if (matches) {
            const [, type, attr] = matches;
            switch (type) {
                case 'bind':
                    propsComp[attr] = { name: value };
                    trimProps = false;
                    break;
                case 'on':
                    eventsComp[attr] = value;
                    trimEvents = false;
                    break;
            }
        } else {
            propsComp[prop] = value;
            trimProps = false;
        }
    }
    const comp: Component = {
        tag: tag,
        props: propsComp,
        events: eventsComp,
        children: processRC(children)
    };
    if (trimProps) {
        delete comp.props;
    }
    if (trimEvents) {
        delete comp.events;
    }
    return comp;
}

export function processRC(tree: CMLTree): RCMLResult[] {
    const result: RCMLResult[] = [];
    for (const node of tree) {
        if (typeof node === 'string') {
            result.push(...extractTextProps(node));
        } else {
            result.push(processComponent(node));
        }
    }
    return result;
}

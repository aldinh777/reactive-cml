import { State } from '@aldinh777/reactive';
import { StateList, StateMap } from '@aldinh777/reactive/collection';

export type Properties = StaticProperties<any>;
export type PropAlias = string[];

export interface StaticProperties<T> {
    [key: string]: T;
}
export interface TextProp {
    name: string;
}

export function undupe<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

export function isReactive(item: any) {
    return (
        item instanceof State ||
        item instanceof StateList ||
        item instanceof StateMap
    );
}

export function statifyObj(obj: Properties, aliases: PropAlias[]): Properties {
    const ob: Properties = Object.assign({}, obj);
    for (const [alias, prop] of aliases) {
        const item = obj[prop];
        if (!isReactive(item)) {
            ob[alias] = new State(obj[prop]);
        }
    }
    return ob;
}

export function cloneObjWithAlias(
    params: Properties,
    aliases: PropAlias[],
    obj: Properties
): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const [alias, prop] of aliases) {
        ob[alias] = obj[prop];
    }
    return ob;
}

export function cloneMapWithAlias(
    params: Properties,
    aliases: PropAlias[],
    map: Map<string, any>
): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const [alias, prop] of aliases) {
        ob[alias] = map.get(prop);
    }
    return ob;
}

export function cloneObjWithValue(
    params: Properties,
    name: string,
    value: any
): Properties {
    const ob: Properties = Object.assign({}, params);
    ob[name] = value;
    return ob;
}

export function extractTextProps(text: string): (string | TextProp)[] {
    const result: (string | TextProp)[] = [];
    let stream = '';
    let propname = '';
    let flagProp = false;
    let flagPropname = false;
    let flagWhitespace = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (flagProp) {
            if (flagWhitespace) {
                if (c === '{') {
                    stream += '{' + propname;
                    propname = '';
                } else if (c === '}') {
                    flagProp = false;
                    flagWhitespace = false;
                    stream += '{' + propname + '}';
                } else if (c.match(/[^\s]/)) {
                    flagWhitespace = false;
                    flagPropname = true;
                    propname += c;
                } else {
                    propname += c;
                }
            } else if (flagPropname) {
                if (c === '{') {
                    flagPropname = false;
                    flagWhitespace = true;
                    stream += '{' + propname;
                    propname = '';
                } else if (
                    c === '}' &&
                    propname.match(/^\s*[\$_A-Za-z][\$_\w]*/)
                ) {
                    flagProp = false;
                    result.push(stream, { name: propname });
                    stream = '';
                    propname = '';
                } else if (c.match(/\s/)) {
                    flagPropname = false;
                    propname += c;
                } else if (c.match(/[\$_\w]/)) {
                    propname += c;
                } else {
                    flagPropname = false;
                    flagProp = false;
                    stream += '{' + propname + c;
                    propname = '';
                }
            } else {
                if (c === '}' && propname.match(/^\s*[\$_A-Za-z][\$_\w]*/)) {
                    flagProp = false;
                    result.push(stream, { name: propname });
                    stream = '';
                    propname = '';
                } else if (c.match(/\s/)) {
                    propname += c;
                } else {
                    flagProp = false;
                    stream += '{' + propname + c;
                    propname = '';
                }
            }
        } else {
            if (c === '\\' && text[i + 1] === '{') {
                stream += '\\{';
                i++;
                continue;
            } else if (c === '{') {
                flagProp = true;
                flagWhitespace = true;
            } else {
                stream += c;
            }
        }
    }
    if (flagProp) {
        stream += '{' + propname;
    }
    if (stream) {
        result.push(stream);
    }
    return result;
}

import { Properties } from '../util';

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

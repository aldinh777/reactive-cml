import { Properties } from '../util';

export type PropAlias = string[];

export function propObjClone(
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

export function propMapClone(
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

export function cloneSetVal(params: Properties, name: string, value: any): Properties {
    const ob: Properties = Object.assign({}, params);
    ob[name] = value;
    return ob;
}

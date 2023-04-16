import { Properties } from './types';

export type PropAlias = [prop: string, alias: string];

export function propAlias(
    params: Properties,
    aliases: PropAlias[],
    obj: object | Map<string, any>
): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const [prop, alias] of aliases) {
        ob[alias] = obj instanceof Map ? obj.get(prop) : obj[prop];
    }
    return ob;
}

export function readAlias(propsquery: string): PropAlias[] {
    return propsquery.split(/\s+/).map((query) => {
        const matches = query.match(/(.+):(.+)/);
        return matches ? [matches[1], matches[2]] : [query, query];
    });
}

import { Properties } from '../util';

export type PropAlias = string[];

export function propAlias(
    params: Properties,
    aliases: PropAlias[],
    obj: Properties | Map<string, any>
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
        if (matches) {
            const [_, prop, alias] = matches;
            return [prop, alias];
        } else {
            return [query, query];
        }
    });
}

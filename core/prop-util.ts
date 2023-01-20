import { Properties } from '../common/types';

export type PropAlias = [prop: string, alias: string];

export function propAlias(
    params: Properties<any>,
    aliases: PropAlias[],
    obj: Properties<any> | Map<string, any>
): Properties<any> {
    const ob: Properties<any> = Object.assign({}, params);
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

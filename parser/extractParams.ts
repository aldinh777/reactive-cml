import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps } from '../core/util';
import { Identifiers, TreePreprocessor } from '../core/types';

function undupe<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

function preprocessCML(
    item: CMLObject,
    ids: Identifiers,
    preprocessors: TreePreprocessor[],
    isRoot: boolean = false
): CMLObject {
    let processed = item;
    for (const pre of preprocessors) {
        processed = pre(processed, ids, isRoot);
    }
    return processed;
}

export function extractParams(
    items: CMLTree,
    preprocessors: TreePreprocessor[],
    blacklist: Set<string> = new Set()
): Identifiers {
    let dep: string[] = [];
    let par: string[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const params = extractTextProps(item)
                .filter((i) => typeof i !== 'string')
                .map(([propname]) => propname);
            par.push(...params);
            continue;
        }
        const localBlacklist = new Set(blacklist);
        const processedItem = preprocessCML(item, [dep, par, localBlacklist], preprocessors);
        const { children } = processedItem;
        const [dependencies, params] = extractParams(children, preprocessors, localBlacklist);
        dep = dep.concat(dependencies);
        par = par.concat(params);
    }
    dep = undupe(dep);
    par = undupe(par).filter((param) => !blacklist.has(param));
    return [dep, par];
};

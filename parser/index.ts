import { CMLTree, parseCML } from '@aldinh777/cml-parser';
import { undupe } from '../util';

type ImportFlag = 'import'|'from'|'end';

interface ExtractedParams {
    dependencies: string[];
    params: string[];
}

function extractImportsIndex(source: string): number {
    let flag: ImportFlag = 'import';
    let imp: string = '';
    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch.match(/\s/)) {
            if (imp.length <= 0) {
                continue;
            }
            if (flag === 'import') {
                if (imp === 'import') {
                    flag = 'from';
                } else {
                    return i - imp.length;
                }
            } else if (flag === 'from') {
                if (imp === 'from') {
                    flag = 'end';
                }
            } else if (flag === 'end') {
                flag = 'import';
            }
            imp = '';
        } else {
            imp += ch;
        }
    }
    return source.length;
}

function extractParams(items: CMLTree, blacklist = new Set()): ExtractedParams {
    let dep: string[] = [];
    let par: string[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const matches = item.matchAll(/\{(.*?)\}/g);
            for (const [, param] of Array.from(matches)) {
                par.push(param.trim());
            }
        } else {
            const { tag, props, children } = item;
            const localBlacklist = new Set(blacklist);
            if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
                dep.push(tag);
            }
            switch (tag) {
                case 'if':
                    const appendCondition = props['condition'];
                    par.push(appendCondition);
                    break;

                case 'unless':
                    const removeCondition = props['condition'];
                    par.push(removeCondition);
                    break;

                case 'foreach':
                    const list = props['list'];
                    const localItem = props['as'];
                    localBlacklist.add(localItem);
                    par.push(list);
                    break;

                case 'destruct':
                    const obj = props['object'];
                    const localPropQuery = props['as'];
                    const localPropNames = localPropQuery.split(/\s+/).map((s: string) => {
                        const matches = s.match(/(.+):(.+)/);
                        if (matches) {
                            const [_, alias] = matches;
                            return alias;
                        } else {
                            return s;
                        }
                    });
                    for (const prop of localPropNames) {
                        localBlacklist.add(prop);
                    }
                    par.push(obj);
                    break;

                default:
                    for (const key in props) {
                        const match = key.match(/(on|bind):(.+)/);
                        if (match) {
                            par.push(props[key].trim());
                        }
                    }
                    break;
            }
            const { dependencies, params } = extractParams(children, localBlacklist);
            dep = dep.concat(dependencies);
            par = par.concat(params);
        }
    }
    dep = undupe(dep);
    par = undupe(par).filter(param => !blacklist.has(param));
    return {
        dependencies: dep,
        params: par
    };
}

export function parseReactiveCML(source: string): string {
    const importIndex = extractImportsIndex(source);
    let separatorIndex: number = source.length;
    const matchResult = source.match(/(div|span)(\s+.*=".*")*\s*</);
    if (matchResult) {
        const matchIndex = matchResult.index;
        if (typeof matchIndex === 'number') {
            separatorIndex = matchIndex;
        }
    }
    const [imports, script, cml] = [
        source.substring(0, importIndex),
        source.substring(importIndex, separatorIndex),
        source.substring(separatorIndex)
    ];

    const cmlTree = parseCML(cml);
    const cmlJson = JSON.stringify(cmlTree, null, 2);

    const { dependencies, params } = extractParams(cmlTree);

    const result =
          `import { state, observe, observeAll } from '@aldinh777/reactive'\n`
        + `import { stateList, stateMap } from '@aldinh777/reactive/collection'\n`
        + `import { intoDom } from '@aldinh777/reactive-cml'\n`
        + `${imports}\n`
        + `export default function(props) {\n`
        + `${script}`
        + `return intoDom(${cmlJson}, `
        + `{${params.concat(dependencies).join()}})}`;
    return result;
}

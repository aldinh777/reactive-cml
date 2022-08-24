import { CMLTree, parseCML } from '@aldinh777/cml-parser';
import { processRC } from '..';
import { extractTextProps, TextProp, undupe } from '../util';

type ImportsResult = [query: string, module: string];
type ImportType = 'none' | 'import' | 'require';

interface ExtractedParams {
    dependencies: string[];
    params: string[];
}

enum ImportFlag {
    start,
    from,
    find
}

function extractImports(source: string): [number, ImportsResult[]] {
    let endIndex: number = 0;
    let imports: ImportsResult[] = [];
    let flag: ImportFlag = ImportFlag.start;
    let mode: ImportType = 'none';
    let imp: string = '';
    let impos: string = '';
    for (let i = 0; i < source.length; i++) {
        const chr = source[i];
        if (mode === 'import') {
            if (chr.match(/\s/)) {
                if (!imp) {
                    continue;
                }
                if (flag === ImportFlag.start) {
                    if (imp === 'from') {
                        flag = ImportFlag.from;
                    } else {
                        impos += imp;
                    }
                } else if (flag === ImportFlag.from) {
                    const impatch = imp.match(/((['"`])(.+)\2)/);
                    if (impatch) {
                        imports.push([impos, impatch[1]]);
                        flag = ImportFlag.start;
                        mode = 'none';
                        endIndex = i;
                        impos = '';
                        imp = '';
                    } else {
                        return [endIndex, imports];
                    }
                }
                imp = '';
            } else {
                imp += chr;
            }
        } else if (mode === 'require') {
            if (flag === ImportFlag.start) {
                if (chr === '=') {
                    flag = ImportFlag.find;
                } else {
                    impos += chr;
                }
            } else if (flag === ImportFlag.find) {
                if (chr.match(/\s/)) {
                    continue;
                } else if (chr.match(/[A-Za-z]/)) {
                    imp += chr;
                } else if (imp === 'require') {
                    flag = ImportFlag.from;
                    imp = chr;
                } else {
                    return [endIndex, imports];
                }
            } else if (flag === ImportFlag.from) {
                if (chr.match(/[\n\r;]/)) {
                    const impatch = imp.match(/\(\s*((['"])(.+)\2)\s*\)/);
                    if (impatch) {
                        imports.push([impos, impatch[1]]);
                        flag = ImportFlag.start;
                        mode = 'none';
                        endIndex = i;
                        impos = '';
                        imp = '';
                    } else {
                        return [endIndex, imports];
                    }
                } else {
                    imp += chr;
                }
            }
        } else {
            if (chr.match(/[\s;]/)) {
                if (!imp) {
                    continue;
                }
                if (imp === 'import') {
                    mode = 'import';
                } else if (imp === 'const') {
                    mode = 'require';
                } else {
                    return [endIndex, imports];
                }
                imp = '';
            } else {
                imp += chr;
            }
        }
    }
    return [endIndex, imports];
}

function extractParams(items: CMLTree, blacklist = new Set()): ExtractedParams {
    let dep: string[] = [];
    let par: string[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const params = extractTextProps(item)
                .filter((i) => typeof i !== 'string')
                .map((tp) => (tp as TextProp).name);
            par.push(...params);
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
    par = undupe(par).filter((param) => !blacklist.has(param));
    return {
        dependencies: dep,
        params: par
    };
}

export function parseReactiveCML(source: string, mode: 'import' | 'require' = 'import'): string {
    const [importIndex, imports] = extractImports(source);
    let separatorIndex: number = source.length;
    const matchResult = source.match(/(div|span)(\s+.*=".*")*\s*</);
    if (matchResult) {
        const matchIndex = matchResult.index;
        if (typeof matchIndex === 'number') {
            separatorIndex = matchIndex;
        }
    }
    const [script, cml] = [
        source.substring(importIndex, separatorIndex),
        source.substring(separatorIndex)
    ];

    const cmlTree = parseCML(cml);
    const rcResult = processRC(cmlTree);
    const rcJson = JSON.stringify(rcResult, null, 2);

    const { dependencies, params } = extractParams(cmlTree);
    const fullparams = params.concat(dependencies);

    const retQuery =
        fullparams.length > 0
            ? `return intoDom(${rcJson}, {${fullparams.join()}}, _children)}`
            : `return ${rcJson}`;

    const staticDependency: [string, string[]][] = [
        ['@aldinh777/reactive', ['state', 'observe', 'observeAll']],
        ['@aldinh777/reactive/collection', ['stateList', 'stateMap']],
        ['@aldinh777/reactive-cml/dom', ['intoDom']]
    ];

    let outdep = '';
    if (mode === 'import') {
        outdep =
            staticDependency
                .map(([from, imports]) => `import { ${imports.join()} } from '${from}'\n`)
                .join('') +
            `${imports.map(([q, f]) => `import ${q} from ${f}\n`).join('')}` +
            `\n` +
            `export default `;
    } else {
        outdep =
            staticDependency
                .map(([from, imports]) => `const { ${imports.join()} } = require('${from}')\n`)
                .join('') +
            `${imports.map(([q, f]) => `const ${q} = require(${f})\n`).join('')}` +
            `\n` +
            `module.exports = `;
    }
    const outscript =
        `function(props={}, _children, dispatch=()=>{}) {\n` + `${script.trim()}\n` + retQuery;
    return outdep + outscript;
}

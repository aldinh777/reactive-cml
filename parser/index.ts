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
                case 'unless':
                    if (Reflect.has(props, 'state:condition')) {
                        const state = props['state:condition'];
                        delete props['state:condition'];
                        props.condition = state;
                        item.tag = 'ControlState';
                        dep.push('ControlState');
                        par.push(state);
                    } else {
                        const appendCondition = props['condition'];
                        par.push(appendCondition);
                    }
                    break;

                case 'foreach':
                    const localItem = props['as'];
                    localBlacklist.add(localItem);
                    if (Reflect.has(props, 'state:list')) {
                        const state = props['state:list'];
                        delete props['state:list'];
                        props.list = state;
                        item.tag = 'LoopState';
                        dep.push('LoopState');
                        par.push(state);
                    } else if (Reflect.has(props, 'collect:list')) {
                        const collect = props['collect:list'];
                        delete props['collect:list'];
                        props.list = collect;
                        item.tag = 'LoopCollect';
                        dep.push('LoopCollect');
                        par.push(collect);
                    } else {
                        const list = props['list'];
                        par.push(list);
                    }
                    break;

                case 'destruct':
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
                    if (Reflect.has(props, 'state:object')) {
                        const state = props['state:object'];
                        delete props['state:object'];
                        props.object = state;
                        item.tag = 'DestructState';
                        dep.push('DestructState');
                        par.push(state);
                    } else if (Reflect.has(props, 'collect:object')) {
                        const collect = props['collect:object'];
                        delete props['collect:object'];
                        props.object = collect;
                        item.tag = 'DestructCollect';
                        dep.push('DestructCollect');
                        par.push(collect);
                    } else {
                        const obj = props['object'];
                        par.push(obj);
                    }
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

export function parseReactiveCML(source: string, mode: ImportType = 'import'): string {
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
    const { dependencies, params } = extractParams(cmlTree);
    const fullparams = params.concat(dependencies);
    const rcResult = processRC(cmlTree);
    const rcJson = JSON.stringify(rcResult, null, 2);

    const autoDependencies: [string, string[]][] = [];
    const controlComp = new Set([
        'ControlState',
        'DestructCollect',
        'DestructState',
        'LoopCollect',
        'LoopState'
    ]);
    const baseDependencies = dependencies.filter((dep) => controlComp.has(dep));

    let outreturn = '';
    if (fullparams.length > 0) {
        autoDependencies.push(['@aldinh777/reactive-cml/dom', ['intoDom']]);
        outreturn = `return intoDom(${rcJson}, {${fullparams.join()}}, _children)`;
    } else {
        autoDependencies.push(['@aldinh777/reactive-cml/dom/dom-util', ['simpleDom']]);
        outreturn = `return simpleDom(${rcJson})`;
    }

    let outdep = '';
    if (mode === 'import') {
        outdep =
            autoDependencies
                .map(([from, imports]) => `import { ${imports.join()} } from '${from}'\n`)
                .join('') +
            baseDependencies
                .map(
                    (dep) => `import ${dep} from '@aldinh777/reactive-cml/dom/components/${dep}'\n`
                )
                .join('') +
            `${imports.map(([q, f]) => `import ${q} from ${f}\n`).join('')}` +
            `\n` +
            `export default `;
    } else {
        outdep =
            autoDependencies
                .map(([from, imports]) => `const { ${imports.join()} } = require('${from}')\n`)
                .join('') +
            baseDependencies
                .map(
                    (dep) =>
                        `const ${dep} = require('@aldinh777/reactive-cml/dom/components/${dep}')\n`
                )
                .join('') +
            `${imports.map(([q, f]) => `const ${q} = require(${f})\n`).join('')}` +
            `\n` +
            `module.exports = `;
    }
    const outscript = `function(props={}, _children, dispatch=()=>{}) {\n${script.trim()}\n${outreturn}\n}`;
    return outdep + outscript;
}

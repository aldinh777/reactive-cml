import { CMLTree, parseCML } from '@aldinh777/cml-parser';
import { processRC } from '..';
import { extractTextProps, TextProp, undupe } from '../util';
import CompileError from '../error/CompileError';

type ImportsResult = [query: string, module: string];
type ImportType = 'none' | 'import' | 'require';

interface ExtractedParams {
    dependencies: string[];
    params: string[];
}

interface RCMLParserOptions {
    mode?: ImportType;
    trimCML?: boolean;
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

function extractParams(items: CMLTree, blacklist: Set<string> = new Set()): ExtractedParams {
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
                if (isInvalid(tag)) {
                    throw CompileError.invalidComponent(tag);
                }
                dep.push(tag);
            }
            switch (tag) {
                case 'children':
                    item.tag = 'Children';
                    dep.push('Children');
                    break;
                case 'if':
                case 'unless':
                    if (tag === 'unless') {
                        props.rev = '';
                    }
                    if (Reflect.has(props, 'state:val')) {
                        const state = props['state:val'];
                        if (!state) {
                            throw CompileError.statementRequire('if', 'val');
                        }
                        if (isInvalid(state)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'list', state);
                        }
                        delete props['state:val'];
                        props.val = state;
                        item.tag = 'ControlState';
                        dep.push('ControlState');
                        par.push(state);
                    } else {
                        const appendCondition = props['val'];
                        if (!appendCondition) {
                            throw CompileError.statementRequire('if', 'val');
                        }
                        if (isInvalid(appendCondition)) {
                            throw CompileError.invalidIdentifier(
                                tag,
                                'property',
                                'list',
                                appendCondition
                            );
                        }
                        item.tag = 'ControlBasic';
                        dep.push('ControlBasic');
                        par.push(appendCondition);
                    }
                    break;
                case 'foreach':
                    const localItem = props['as'];
                    localBlacklist.add(localItem);
                    if (Reflect.has(props, 'state:list')) {
                        const state = props['state:list'];
                        if (!state) {
                            throw CompileError.statementRequire('foreach', 'list');
                        }
                        if (isInvalid(state)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'list', state);
                        }
                        delete props['state:list'];
                        props.list = state;
                        item.tag = 'LoopState';
                        dep.push('LoopState');
                        par.push(state);
                    } else if (Reflect.has(props, 'collect:list')) {
                        const collect = props['collect:list'];
                        if (!collect) {
                            throw CompileError.statementRequire('foreach', 'list');
                        }
                        if (isInvalid(collect)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'list', collect);
                        }
                        delete props['collect:list'];
                        props.list = collect;
                        item.tag = 'LoopCollect';
                        dep.push('LoopCollect');
                        par.push(collect);
                    } else {
                        const list = props['list'];
                        if (!list) {
                            throw CompileError.statementRequire('foreach', 'list');
                        }
                        if (isInvalid(list)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'list', list);
                        }
                        item.tag = 'LoopBasic';
                        dep.push('LoopBasic');
                        par.push(list);
                    }
                    break;
                case 'destruct':
                    const localPropQuery = props['as'];
                    const localPropNames = localPropQuery.split(/\s+/).map((s: string) => {
                        const matches = s.match(/(.+):(.+)/);
                        if (matches) {
                            return matches[2];
                        } else {
                            return s;
                        }
                    });
                    for (const prop of localPropNames) {
                        localBlacklist.add(prop);
                    }
                    if (Reflect.has(props, 'state:obj')) {
                        const state = props['state:obj'];
                        if (!state) {
                            throw CompileError.statementRequire('destruct', 'obj');
                        }
                        if (isInvalid(state)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'obj', state);
                        }
                        delete props['state:obj'];
                        props.obj = state;
                        item.tag = 'DestructState';
                        dep.push('DestructState');
                        par.push(state);
                    } else if (Reflect.has(props, 'collect:obj')) {
                        const collect = props['collect:obj'];
                        if (!collect) {
                            throw CompileError.statementRequire('destruct', 'obj');
                        }
                        if (isInvalid(collect)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'obj', collect);
                        }
                        delete props['collect:obj'];
                        props.obj = collect;
                        item.tag = 'DestructCollect';
                        dep.push('DestructCollect');
                        par.push(collect);
                    } else {
                        const obj = props['obj'];
                        if (!obj) {
                            throw CompileError.statementRequire('destruct', 'obj');
                        }
                        if (isInvalid(obj)) {
                            throw CompileError.invalidIdentifier(tag, 'property', 'obj', obj);
                        }
                        item.tag = 'DestructBasic';
                        dep.push('DestructBasic');
                        par.push(obj);
                    }
                    break;
                default:
                    for (const key in props) {
                        const match = key.match(/(on|bind):(.+)/);
                        if (match) {
                            const type = match[1] === 'on' ? 'event' : 'property';
                            const prop = match[2];
                            const param = props[key].trim();
                            if (!param) {
                                throw CompileError.emptyBindedProperty(tag, type, prop);
                            }
                            if (isInvalid(param)) {
                                throw CompileError.invalidIdentifier(tag, type, prop, param);
                            }
                            par.push(param);
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

function isInvalid(id: string): RegExpMatchArray | null {
    return id.match(/(^\d|[^\w_$])/);
}

function improt(dep: string | string[], from: string, mode: ImportType): string {
    let deps = typeof dep === 'string' ? dep : `{ ${dep.join()} }`;
    if (mode === 'import') {
        return `import ${deps} from ${from}\n`;
    } else {
        return `const ${deps} = require(${from})\n`;
    }
}

export function parseReactiveCML(
    source: string,
    options: RCMLParserOptions = {
        mode: 'import',
        trimCML: true
    }
): string {
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

    const cmlTree = parseCML(cml, options.trimCML);
    const { dependencies, params } = extractParams(cmlTree);
    const fullparams = params.concat(dependencies);
    const rcResult = processRC(cmlTree);
    const rcJson = JSON.stringify(rcResult, null, 2);

    const autoDependencies: [string, string[]][] = [];
    const controlComp = new Set([
        'Children',
        'ControlBasic',
        'ControlState',
        'DestructBasic',
        'DestructCollect',
        'DestructState',
        'LoopBasic',
        'LoopCollect',
        'LoopState'
    ]);
    const baseCompPath = '@aldinh777/reactive-cml/dom/components';
    const baseDependencies = dependencies.filter((dep) => controlComp.has(dep));

    let outreturn = '';
    if (fullparams.length > 0) {
        autoDependencies.push(["'@aldinh777/reactive-cml/dom'", ['intoDom']]);
        outreturn = `return intoDom(${rcJson}, {${fullparams.join()}}, _children)`;
    } else if (rcResult.length > 0) {
        autoDependencies.push(["'@aldinh777/reactive-cml/dom/dom-util'", ['simpleDom']]);
        outreturn = `return simpleDom(${rcJson})`;
    } else {
        outreturn = '';
    }

    let outdep = '';
    if (options.mode === 'import') {
        outdep =
            autoDependencies.map(([from, imports]) => improt(imports, from, 'import')).join('') +
            baseDependencies
                .map((dep) => improt(dep, `'${baseCompPath}/${dep}'`, 'import'))
                .join('') +
            `${imports.map(([q, f]) => improt(q, f, 'import')).join('')}` +
            `\n` +
            `export default `;
    } else {
        outdep =
            autoDependencies.map(([from, imports]) => improt(imports, from, 'require')).join('') +
            baseDependencies
                .map((dep) => improt(dep, `'${baseCompPath}/${dep}'`, 'require'))
                .join('') +
            `${imports.map(([q, f]) => improt(q, f, 'require')).join('')}` +
            `\n` +
            `module.exports = `;
    }
    const outscript = `function(props={}, _children, dispatch=()=>{}) {\n${script.trim()}\n${outreturn}\n}`;
    return outdep + outscript;
}

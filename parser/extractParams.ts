import { CMLTree } from '@aldinh777/cml-parser';
import CompileError from '../error/CompileError';
import { extractTextProps, TextProp, undupe } from '../util';

interface ExtractedParams {
    dependencies: string[];
    params: string[];
}

function isInvalidIdentifier(id: string): RegExpMatchArray | null {
    return id.match(/(^\d|[^\w_$])/);
}

export default function extractParams(
    items: CMLTree,
    blacklist: Set<string> = new Set()
): ExtractedParams {
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
                if (isInvalidIdentifier(tag)) {
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
                        if (isInvalidIdentifier(state)) {
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
                        if (isInvalidIdentifier(appendCondition)) {
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
                        if (isInvalidIdentifier(state)) {
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
                        if (isInvalidIdentifier(collect)) {
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
                        if (isInvalidIdentifier(list)) {
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
                        if (isInvalidIdentifier(state)) {
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
                        if (isInvalidIdentifier(collect)) {
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
                        if (isInvalidIdentifier(obj)) {
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
                            if (isInvalidIdentifier(param)) {
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

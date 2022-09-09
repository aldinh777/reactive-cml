import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { Identifiers } from '../extractParams';
import { isInvalidIdentifier } from '../parser-util';

export default function (item: CMLObject, [dep, par, bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== 'destruct') {
        return item;
    }
    const propqueries = props['as'];
    const propnames = propqueries.split(/\s+/).map((s: string) => {
        const matches = s.match(/(.+):(.+)/);
        if (matches) {
            return matches[2];
        } else {
            return s;
        }
    });
    for (const prop of propnames) {
        bl?.add(prop);
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
    return item;
}

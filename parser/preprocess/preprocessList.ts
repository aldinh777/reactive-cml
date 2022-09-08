import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { Identifiers, isInvalidIdentifier } from '../extractParams';

export default function (item: CMLObject, [dep, par, bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== 'foreach') {
        return item;
    }
    const localItem = props['as'];
    bl?.add(localItem);
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
    return item;
}

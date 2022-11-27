import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import {
    COMPONENT_LIST_BASIC,
    COMPONENT_LIST_COLLECTION,
    COMPONENT_LIST_STATE,
    PROP_COLLECTION_LIST,
    PROP_CONTROL_AS,
    PROP_CONTROL_LIST,
    PROP_STATE_LIST,
    TAG_FOREACH
} from '../constants';
import { Identifiers } from '../extractParams';
import { isInvalidIdentifier } from '../parser-util';

export default function (item: CMLObject, [dep, par, bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== TAG_FOREACH) {
        return item;
    }
    const localItem = props[PROP_CONTROL_AS];
    bl?.add(localItem);
    if (Reflect.has(props, PROP_STATE_LIST)) {
        const state = props[PROP_STATE_LIST];
        if (!state) {
            throw CompileError.statementRequire(TAG_FOREACH, PROP_CONTROL_LIST);
        }
        if (isInvalidIdentifier(state)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_LIST, state);
        }
        delete props[PROP_STATE_LIST];
        props.list = state;
        item.tag = COMPONENT_LIST_STATE;
        dep.push(COMPONENT_LIST_STATE);
        par.push(state);
    } else if (Reflect.has(props, PROP_COLLECTION_LIST)) {
        const collect = props[PROP_COLLECTION_LIST];
        if (!collect) {
            throw CompileError.statementRequire(TAG_FOREACH, PROP_CONTROL_LIST);
        }
        if (isInvalidIdentifier(collect)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_LIST, collect);
        }
        delete props[PROP_COLLECTION_LIST];
        props.list = collect;
        item.tag = COMPONENT_LIST_COLLECTION;
        dep.push(COMPONENT_LIST_COLLECTION);
        par.push(collect);
    } else {
        const list = props[PROP_CONTROL_LIST];
        if (!list) {
            throw CompileError.statementRequire(TAG_FOREACH, PROP_CONTROL_LIST);
        }
        if (isInvalidIdentifier(list)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_LIST, list);
        }
        item.tag = COMPONENT_LIST_BASIC;
        dep.push(COMPONENT_LIST_BASIC);
        par.push(list);
    }
    return item;
}

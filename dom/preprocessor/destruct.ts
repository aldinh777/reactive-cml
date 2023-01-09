import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import {
    COMPONENT_DESTRUCT_BASIC,
    COMPONENT_DESTRUCT_COLLECTION,
    COMPONENT_DESTRUCT_STATE
} from '../constants';
import { isInvalidIdentifier } from '../../util';
import { Identifiers } from '../../util-type';
import {
    TAG_DESTRUCT,
    PROP_STATE_OBJECT,
    PROP_CONTROL_OBJECT,
    PROP_COLLECTION_OBJECT
} from '../../common/constants';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== TAG_DESTRUCT) {
        return item;
    }
    if (Reflect.has(props, PROP_STATE_OBJECT)) {
        const state = props[PROP_STATE_OBJECT];
        if (!state) {
            throw CompileError.statementRequire(TAG_DESTRUCT, PROP_CONTROL_OBJECT);
        }
        if (isInvalidIdentifier(state)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_OBJECT, state);
        }
        delete props[PROP_STATE_OBJECT];
        props.obj = state;
        item.tag = COMPONENT_DESTRUCT_STATE;
        dep.push(COMPONENT_DESTRUCT_STATE);
        par.push(state);
    } else if (Reflect.has(props, PROP_COLLECTION_OBJECT)) {
        const collect = props[PROP_COLLECTION_OBJECT];
        if (!collect) {
            throw CompileError.statementRequire(TAG_DESTRUCT, PROP_CONTROL_OBJECT);
        }
        if (isInvalidIdentifier(collect)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_OBJECT, collect);
        }
        delete props[PROP_STATE_OBJECT];
        props.obj = collect;
        item.tag = COMPONENT_DESTRUCT_COLLECTION;
        dep.push(COMPONENT_DESTRUCT_COLLECTION);
        par.push(collect);
    } else {
        const obj = props[PROP_CONTROL_OBJECT];
        if (!obj) {
            throw CompileError.statementRequire(TAG_DESTRUCT, PROP_CONTROL_OBJECT);
        }
        if (isInvalidIdentifier(obj)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_OBJECT, obj);
        }
        item.tag = COMPONENT_DESTRUCT_BASIC;
        dep.push(COMPONENT_DESTRUCT_BASIC);
        par.push(obj);
    }
    return item;
}

import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_DESTRUCT, PROP_CONTROL_OBJECT } from '../../common/constants';
import {
    COMPONENT_COLLECTION_DESTRUCT,
    COMPONENT_STATE_DESTRUCT,
    PROP_COLLECTION_OBJECT,
    PROP_STATE_OBJECT
} from '../constants';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_DESTRUCT) {
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
            item.tag = COMPONENT_STATE_DESTRUCT;
            dep.push(COMPONENT_STATE_DESTRUCT);
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
            item.tag = COMPONENT_COLLECTION_DESTRUCT;
            dep.push(COMPONENT_COLLECTION_DESTRUCT);
            par.push(collect);
        }
    }
    return item;
}

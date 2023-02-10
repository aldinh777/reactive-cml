import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_FOREACH, PROP_CONTROL_AS, PROP_CONTROL_LIST } from '../../common/constants';
import {
    COMPONENT_COLLECTION_FOREACH,
    COMPONENT_STATE_FOREACH,
    PROP_COLLECTION_LIST,
    PROP_STATE_LIST
} from '../constants';

export default function (item: CMLObject, [dep, par, bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_FOREACH) {
        const localItem = props[PROP_CONTROL_AS];
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
            item.tag = COMPONENT_STATE_FOREACH;
            dep.push(COMPONENT_STATE_FOREACH);
            par.push(state);
            bl?.add(localItem);
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
            item.tag = COMPONENT_COLLECTION_FOREACH;
            dep.push(COMPONENT_COLLECTION_FOREACH);
            par.push(collect);
            bl?.add(localItem);
        }
    }
    return item;
}

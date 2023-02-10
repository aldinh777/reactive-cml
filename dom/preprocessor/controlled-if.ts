import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_IF, TAG_UNLESS, PROP_CONTROL_VALUE } from '../../common/constants';
import { COMPONENT_STATE_IF, PROP_STATE_VALUE } from '../constants';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_IF || tag === TAG_UNLESS) {
        if (Reflect.has(props, PROP_STATE_VALUE)) {
            if (tag === TAG_UNLESS) {
                props.rev = '';
            }
            const stateName = props[PROP_STATE_VALUE];
            if (!stateName) {
                throw CompileError.statementRequire(TAG_IF, PROP_CONTROL_VALUE);
            }
            if (isInvalidIdentifier(stateName)) {
                throw CompileError.invalidProperty(tag, PROP_CONTROL_VALUE, stateName);
            }
            delete props[PROP_STATE_VALUE];
            props.value = stateName;
            item.tag = COMPONENT_STATE_IF;
            dep.push(COMPONENT_STATE_IF);
            par.push(stateName);
        }
    }
    return item;
}

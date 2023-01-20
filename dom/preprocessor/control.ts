import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { COMPONENT_CONTROL_STATE, COMPONENT_CONTROL_BASIC } from '../constants';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_IF, TAG_UNLESS, PROP_STATE_VALUE, PROP_CONTROL_VALUE } from '../../common/constants';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== TAG_IF && tag !== TAG_UNLESS) {
        return item;
    }
    if (tag === TAG_UNLESS) {
        props.rev = '';
    }
    if (Reflect.has(props, PROP_STATE_VALUE)) {
        const stateName = props[PROP_STATE_VALUE];
        if (!stateName) {
            throw CompileError.statementRequire(TAG_IF, PROP_CONTROL_VALUE);
        }
        if (isInvalidIdentifier(stateName)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_VALUE, stateName);
        }
        delete props[PROP_STATE_VALUE];
        props.value = stateName;
        item.tag = COMPONENT_CONTROL_STATE;
        dep.push(COMPONENT_CONTROL_STATE);
        par.push(stateName);
    } else {
        const valueName = props[PROP_CONTROL_VALUE];
        if (!valueName) {
            throw CompileError.statementRequire(TAG_IF, PROP_CONTROL_VALUE);
        }
        if (isInvalidIdentifier(valueName)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_VALUE, valueName);
        }
        item.tag = COMPONENT_CONTROL_BASIC;
        dep.push(COMPONENT_CONTROL_BASIC);
        par.push(valueName);
    }
    return item;
}

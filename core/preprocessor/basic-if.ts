import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { COMPONENT_BASIC_IF } from '../constants';
import { isInvalidIdentifier } from '../util';
import { Identifiers } from '../types';
import { TAG_IF, TAG_UNLESS, PROP_CONTROL_VALUE } from '../constants';

export = function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_IF || tag === TAG_UNLESS) {
        if (tag === TAG_UNLESS) {
            props.rev = '';
        }
        const valueName = props[PROP_CONTROL_VALUE];
        if (!valueName) {
            throw CompileError.statementRequire(TAG_IF, PROP_CONTROL_VALUE);
        }
        if (isInvalidIdentifier(valueName)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_VALUE, valueName);
        }
        item.tag = COMPONENT_BASIC_IF;
        dep.push(COMPONENT_BASIC_IF);
        par.push(valueName);
    }
    return item;
};

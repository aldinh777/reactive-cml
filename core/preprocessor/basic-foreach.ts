import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { COMPONENT_BASIC_FOREACH, PROP_CONTROL_AS } from '../constants';
import { isInvalidIdentifier } from '../util';
import { Identifiers } from '../types';
import { TAG_FOREACH, PROP_CONTROL_LIST } from '../constants';

export = function (item: CMLObject, [dep, par, bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_FOREACH) {
        const localItem = props[PROP_CONTROL_AS];
        bl?.add(localItem);
        const list = props[PROP_CONTROL_LIST];
        if (!list) {
            throw CompileError.statementRequire(TAG_FOREACH, PROP_CONTROL_LIST);
        }
        if (isInvalidIdentifier(list)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_LIST, list);
        }
        item.tag = COMPONENT_BASIC_FOREACH;
        dep.push(COMPONENT_BASIC_FOREACH);
        par.push(list);
    }
    return item;
};

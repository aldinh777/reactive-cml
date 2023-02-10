import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { COMPONENT_BASIC_DESTRUCT } from '../constants';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_DESTRUCT, PROP_CONTROL_OBJECT } from '../../common/constants';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_DESTRUCT) {
        const obj = props[PROP_CONTROL_OBJECT];
        if (!obj) {
            throw CompileError.statementRequire(TAG_DESTRUCT, PROP_CONTROL_OBJECT);
        }
        if (isInvalidIdentifier(obj)) {
            throw CompileError.invalidProperty(tag, PROP_CONTROL_OBJECT, obj);
        }
        item.tag = COMPONENT_BASIC_DESTRUCT;
        dep.push(COMPONENT_BASIC_DESTRUCT);
        par.push(obj);
    }
    return item;
}

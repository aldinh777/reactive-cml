import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import {
    TAG_CHILDREN,
    COMPONENT_CHILDREN,
    PROP_CONTROL_EXPORT,
    PROP_CONTROL_EXTRACT
} from '../constants';
import { Identifiers, isInvalidIdentifier } from '../../util';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_CHILDREN) {
        item.tag = COMPONENT_CHILDREN;
        dep.push(COMPONENT_CHILDREN);
        const exported: string = props[PROP_CONTROL_EXPORT] || '';
        if (!exported) {
            return item;
        }
        for (const exp of exported.split(/\s/)) {
            if (isInvalidIdentifier(exp)) {
                throw CompileError.invalidProperty(tag, PROP_CONTROL_EXTRACT, exported);
            }
            par.push(exp);
        }
    }
    return item;
}

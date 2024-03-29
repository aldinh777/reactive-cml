import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { isInvalidIdentifier } from '../util';
import { Identifiers } from '../types';
import {
    COMPONENT_CHILDREN,
    PROP_CONTROL_EXPORT,
    PROP_CONTROL_EXTRACT,
    TAG_CHILDREN
} from '../constants';

export = function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
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
};

import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { COMPONENT_COMPONENT } from '../constants';
import { isInvalidIdentifier } from '../../common/util';
import { Identifiers } from '../../common/types';
import { TAG_COMPONENT } from '../../common/constants';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const { tag } = item;
    if (tag === TAG_COMPONENT) {
        item.tag = COMPONENT_COMPONENT;
        dep.push(COMPONENT_COMPONENT);
    } else if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
        if (isInvalidIdentifier(tag)) {
            throw CompileError.invalidComponent(tag);
        }
        dep.push(tag);
    }
    return item;
}

import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { Identifiers, isInvalidIdentifier } from '../extractParams';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const tag = item.tag;
    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
        if (isInvalidIdentifier(tag)) {
            throw CompileError.invalidComponent(tag);
        }
        dep.push(tag);
    }
    return item;
}

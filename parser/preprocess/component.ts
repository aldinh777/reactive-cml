import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { Identifiers } from '../extractParams';
import { isInvalidIdentifier } from '../parser-util';

export default function (item: CMLObject, [dep, , bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
        if (isInvalidIdentifier(tag)) {
            throw CompileError.invalidComponent(tag);
        }
        dep.push(tag);
    }
    return item;
}

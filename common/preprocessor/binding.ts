import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { isInvalidIdentifier } from '../util';
import { Identifiers } from '../types';

export default function (item: CMLObject, [, par]: Identifiers) {
    const { tag, props } = item;
    for (const key in props) {
        const match = key.match(/(on|bind):(.+)/);
        if (!match) {
            continue;
        }
        const type = match[1] === 'on' ? 'event' : 'property';
        const prop = match[2];
        const param = props[key].trim();
        props[key] = param;
        if (!param) {
            throw CompileError.emptyBindedProperty(tag, type, prop);
        }
        if (isInvalidIdentifier(param)) {
            throw CompileError.invalidIdentifier(tag, type, prop, param);
        }
        par.push(param);
    }
    return item;
}

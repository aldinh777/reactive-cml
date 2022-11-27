import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { PROP_CONTROL_EXTRACT } from '../constants';
import { Identifiers } from '../extractParams';
import { isInvalidIdentifier } from '../parser-util';

export default function (item: CMLObject, [dep, , bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
        if (isInvalidIdentifier(tag)) {
            throw CompileError.invalidComponent(tag);
        }
        const extracts = props[PROP_CONTROL_EXTRACT];
        if (extracts) {
            const propnames = extracts.split(/\s+/).map((s: string) => {
                const matches = s.match(/(.+):(.+)/);
                if (matches) {
                    return matches[2];
                } else {
                    return s;
                }
            });
            for (const prop of propnames) {
                bl?.add(prop);
            }
        }
        dep.push(tag);
    }
    return item;
}

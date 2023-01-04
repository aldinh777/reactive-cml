import { CMLObject } from '@aldinh777/cml-parser';
import { PROP_CONTROL_EXTRACT } from '../constants';
import { Identifiers } from '../../util';

export default function (item: CMLObject, [, , bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
        const extracts = props[PROP_CONTROL_EXTRACT];
        if (!extracts) {
            return item;
        }
        const propnames = extracts.split(/\s+/).map((s: string) => {
            const matches = s.match(/(.+):(.+)/);
            return matches ? matches[2] : s;
        });
        for (const prop of propnames) {
            bl?.add(prop);
        }
    }
    return item;
}

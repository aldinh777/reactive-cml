import { CMLObject } from '@aldinh777/cml-parser';
import { PROP_CONTROL_EXTRACT, TAG_SLOT } from '../constants';
import { Identifiers } from '../extractParams';

export default function (item: CMLObject, [dep, , bl]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag === TAG_SLOT || (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/))) {
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

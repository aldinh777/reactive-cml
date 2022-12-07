import { CMLObject } from '@aldinh777/cml-parser';
import { COMPONENT_SLOT, TAG_SLOT } from '../constants';
import { Identifiers } from '../extractParams';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const { tag } = item;
    if (tag === TAG_SLOT) {
        item.tag = COMPONENT_SLOT;
        dep.push(COMPONENT_SLOT);
    }
    return item;
}

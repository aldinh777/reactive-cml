import { CMLObject } from '@aldinh777/cml-parser';
import { COMPONENT_SLOT } from '../constants';
import { Identifiers } from '../../common/types';
import { TAG_SLOT } from '../../common/constants';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const { tag } = item;
    if (tag === TAG_SLOT) {
        item.tag = COMPONENT_SLOT;
        dep.push(COMPONENT_SLOT);
    }
    return item;
}

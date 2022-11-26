import { CMLObject } from '@aldinh777/cml-parser';
import { TAG_CHILDREN, COMPONENT_CHILDREN } from '../constants';
import { Identifiers } from '../extractParams';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const { tag } = item;
    if (tag === TAG_CHILDREN) {
        item.tag = COMPONENT_CHILDREN;
        dep.push(COMPONENT_CHILDREN);
    }
    return item;
}

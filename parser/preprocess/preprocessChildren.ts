import { CMLObject } from '@aldinh777/cml-parser';
import { Identifiers } from '../extractParams';

export default function (item: CMLObject, [dep]: Identifiers): CMLObject {
    const { tag } = item;
    if (tag === 'children') {
        dep.push('Children');
    }
    return item;
}

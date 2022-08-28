import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';

export default function (
    _props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (_children) {
        return intoDom(_children.tree, _children.params, _children._super);
    }
}

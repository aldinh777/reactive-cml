import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';

export default function (
    _props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (_children && _children._super) {
        const { tree, params, _super } = _children._super;
        return intoDom(tree, params, _super);
    }
}

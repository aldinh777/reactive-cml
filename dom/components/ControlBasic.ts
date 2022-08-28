import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.condition !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const unless = props.rev;
    const condkey = props.condition;
    const condition = unless ? !params[condkey] : params[condkey];
    if (condition) {
        return intoDom(tree, params, _super);
    }
}

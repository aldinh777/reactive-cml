import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.val !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const unless = Reflect.has(props, 'rev');
    const hasEqual = Reflect.has(props, 'equal');
    const val = params[props.val];
    if (hasEqual) {
        const condition = unless ? val != props.equal : val == props.equal;
        if (condition) {
            return intoDom(tree, params, _super);
        }
    } else {
        const condition = unless ? !val : val;
        if (condition) {
            return intoDom(tree, params, _super);
        }
    }
}

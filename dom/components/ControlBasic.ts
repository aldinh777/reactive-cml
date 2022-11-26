import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.val !== 'string') {
        return;
    }
    const { tree, params, _super } = context;
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

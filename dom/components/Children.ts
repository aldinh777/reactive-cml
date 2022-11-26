import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (_props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { tree, params, _super } = context._super;
        return intoDom(tree, params, _super);
    }
}

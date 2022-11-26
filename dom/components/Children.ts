import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (_props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { slots, params, _super } = context._super;
        return intoDom(slots._children, params, _super);
    }
}

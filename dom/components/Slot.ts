import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { children, params, _super } = context;
        if (props.for === _super.slotname) {
            return intoDom(children, params, _super);
        }
    }
}

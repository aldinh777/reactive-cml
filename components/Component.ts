import { Context, intoDom, NodeComponent } from '../dom';
import { Properties } from '../util';

export default function (_props: Properties = {}, context?: Context): NodeComponent[] | void {
    return intoDom(context.children, context.params, context._super);
}

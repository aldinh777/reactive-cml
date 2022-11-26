import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        let slotname: string = '_children';
        if (props.name) {
            slotname = props.name;
        }
        const { slots, params, _super } = context._super;
        return intoDom(slots[slotname], params, _super);
    }
}

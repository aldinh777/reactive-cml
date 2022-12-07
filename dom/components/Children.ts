import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { propAlias, readAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { children, params, _super } = context._super;
        const prevSlotName = _super.slotname;
        _super.slotname = props.name;
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, context.params);
        const output = intoDom(children, localParams, _super);
        _super.slotname = prevSlotName;
        return output;
    }
}

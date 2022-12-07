import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { propAlias, readAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { children, extracts, params, _super } = context._super;
        const prevSlotName = _super.slotname;
        _super.slotname = props.name;
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, context.params);
        const childrenParams = propAlias(params, extracts, localParams);
        const output = intoDom(children, childrenParams, _super);
        _super.slotname = prevSlotName;
        return output;
    }
}

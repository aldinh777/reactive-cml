import { Context, NodeComponent, intoDom } from '../dom';
import { readAlias, propAlias } from '../dom/prop-util';
import { Properties } from '../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { children, extracts, params, _super } = context._super;
        const prevSlotName = _super?.slotname;
        if (_super) {
            _super.slotname = props.name;
        }
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, context.params);
        const childrenParams = propAlias(localParams, extracts, localParams);
        const output = intoDom(children, childrenParams, _super);
        if (_super) {
            _super.slotname = prevSlotName;
        }
        return output.length ? output : intoDom(context.children, context.params, context._super);
    }
}

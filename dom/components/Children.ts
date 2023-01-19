import { Context, NodeComponent, intoDom } from '..';
import { readAlias, propAlias } from '../prop-util';
import { Properties } from '../../util-type';

export default function (
    props: Properties<any> = {},
    component: Context = {}
): NodeComponent[] | void {
    if (component._super) {
        const { children, extracts, params, _super } = component._super;
        const prevSlotName = _super?.slotname;
        if (_super) {
            _super.slotname = props.name;
        }
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, component.params);
        const childrenParams = propAlias(localParams, extracts, localParams);
        const output = intoDom(children, childrenParams, _super);
        if (_super) {
            _super.slotname = prevSlotName;
        }
        return output.length
            ? output
            : intoDom(component.children, component.params, component._super);
    }
}

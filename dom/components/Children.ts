import { Properties } from '../../common/types';
import { readAlias, propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';

export default function Children(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (component._super) {
        const { children, extracts, params, _super } = component._super;
        const prevSlotName = _super?.slotname;
        if (_super) {
            _super.slotname = props.name;
        }
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, component.params);
        const childrenParams = propAlias(localParams, extracts, localParams);
        const output = render(children, childrenParams, _super);
        if (_super) {
            _super.slotname = prevSlotName;
        }
        return output.length
            ? output
            : render(component.children, component.params, component._super);
    }
}

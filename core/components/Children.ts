import { Properties } from '../types';
import { readAlias, propAlias } from '../prop-util';
import { render } from '../render';
import { Component, RenderedResult } from '../types';

export = async function Children(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    if (component._super) {
        const { children, extracts, params, _super } = component._super;
        const prevSlotName = _super?.slotname;
        if (_super) {
            _super.slotname = props.name as string;
        }
        const exported = typeof props.export === 'string' ? readAlias(props.export) : [];
        const localParams = propAlias(params, exported, component.params);
        const childrenParams = propAlias(localParams, extracts, localParams);
        const output = await render(children, childrenParams, _super);
        if (_super) {
            _super.slotname = prevSlotName;
        }
        return output.length
            ? output
            : render(component.children, component.params, component._super);
    }
};

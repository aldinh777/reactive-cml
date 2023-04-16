import { Properties } from '../types';
import { propAlias } from '../prop-util';
import { render } from '../render';
import { Component, RenderedResult } from '../types';

export = async function Slot(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    if (component._super) {
        const { children, extracts, params, _super } = component;
        if (props.for === _super.slotname) {
            const nextParams = propAlias(params, extracts, params);
            return render(children, nextParams, _super);
        }
    }
};

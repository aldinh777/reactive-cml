import { Properties } from '../../common/types';
import { propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';

export default function Slot(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (component._super) {
        const { children, extracts, params, _super } = component;
        if (props.for === _super.slotname) {
            const nextParams = propAlias(params, extracts, params);
            return render(children, nextParams, _super);
        }
    }
}

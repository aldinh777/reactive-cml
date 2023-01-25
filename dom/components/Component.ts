import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import { Properties } from '../../common/types';

export default function Component(
    _props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    return render(component.children, component.params, component._super);
}

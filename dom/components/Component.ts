import { Properties } from '../../common/types';
import { render } from '../../core/render';
import { RenderResult, Component } from '../../core/types';

export default function Component(
    _props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    return render(component.children, component.params, component._super);
}

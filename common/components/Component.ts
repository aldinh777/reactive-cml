import { Properties } from '../types';
import { render } from '../../core/render';
import { RenderedResult, Component } from '../../core/types';

export default function Component(
    _props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
    return render(component.children, component.params, component._super);
}

import { Properties } from '../types';
import { render } from '../../core/render';
import { RenderedResult, Component } from '../../core/types';

export default async function Component(
    _props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    return render(component.children, component.params, component._super);
}

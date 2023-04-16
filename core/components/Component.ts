import { Properties } from '../types';
import { render } from '../render';
import { RenderedResult, Component } from '../types';

export = async function Component(
    _props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    return render(component.children, component.params, component._super);
}

import { Properties } from '../types';
import { render } from '../render';
import { RenderedResult, Context } from '../types';

export = async function Component(
    _props: Properties = {},
    component: Context = {}
): Promise<RenderedResult[] | void> {
    return render(component.children, component.params, component._super);
}

import { Properties } from '../../common/types';
import { PropAlias, readAlias, propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';

export default function DestructBasic(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    const localparams = propAlias(params, propnames, obj);
    return render(children, localparams, _super);
}

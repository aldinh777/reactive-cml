import { Properties } from '../types';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import { render } from '../render';
import { Component, RenderedResult } from '../types';

export = async function Destruct(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj = (params[props.obj] as object | Map<string, unknown>) || {};
    const propnames: PropAlias[] = readAlias(props.extract);
    const localparams = propAlias(params, propnames, obj);
    return render(children, localparams, _super);
};

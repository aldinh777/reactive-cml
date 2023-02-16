import { has } from '@aldinh777/toolbox/object/validate';
import { Properties } from '../types';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';

export default function If(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
    if (typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const unless = has(props, 'rev');
    const hasEqual = has(props, 'equal');
    const value = params[props.value];
    if (hasEqual) {
        const condition = unless ? value != props.equal : value == props.equal;
        if (condition) {
            return render(children, params, _super);
        }
    } else {
        const condition = unless ? !value : value;
        if (condition) {
            return render(children, params, _super);
        }
    }
}

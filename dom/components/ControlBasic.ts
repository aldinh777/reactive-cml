import { has } from '@aldinh777/reactive-utils/validator';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import { Properties } from '../../common/types';

export default function ControlBasic(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const unless = has(props, ['rev']);
    const hasEqual = has(props, ['equal']);
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

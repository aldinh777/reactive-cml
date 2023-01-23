import { State } from '@aldinh777/reactive';
import { has, isState } from '@aldinh777/reactive-utils/validator';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { createMounter } from '../component-helper';

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const unless = has(props, ['rev']);
    let isActive: State<any> = params[props.value];
    if (!isState(isActive)) {
        throw new ComponentError(
            `'${props.value}' are not a valid State in 'state:value' property of '${
                unless ? 'unless' : 'if'
            }' element`
        );
    }
    const hasEqual = has(props, ['equal']);
    const value = isActive.getValue();
    if (hasEqual) {
        const equalValue = props.equal;
        const equalState = new State(unless ? value != equalValue : value == equalValue);
        if (unless) {
            isActive.onChange((next) => equalState.setValue(next != equalValue));
        } else {
            isActive.onChange((next) => equalState.setValue(next == equalValue));
        }
        isActive = equalState;
    } else if (unless) {
        const condition = new State(!value);
        isActive.onChange((next) => condition.setValue(!next));
        isActive = condition;
    }
    const elements = render(children, params, _super);
    const mounter = createMounter('cs', component, {
        onMount() {
            if (isActive.getValue()) {
                mounter.mount(elements);
            }
        },
        preventDismount: () => !isActive.getValue()
    });
    isActive.onChange((active) => {
        if (mounter.isMounted) {
            if (active) {
                mounter.mount(elements);
            } else {
                mounter.dismount();
            }
        }
    });
    return mounter.rendered;
}

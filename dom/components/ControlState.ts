import { State, StateSubscription } from '@aldinh777/reactive';
import { has, isState } from '@aldinh777/reactive-utils/validator';
import { Properties } from '../../common/types';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

function statify(props: Properties<any>, params: Properties<any>): State<boolean> {
    const name = props.value;
    const state = params[name];
    const isUnless = has(props, ['rev']);
    const hasEqual = has(props, ['equal']);
    if (!isState(state)) {
        throw new ComponentError(
            `'${name}' are not a valid State in 'state:value' property of '${
                isUnless ? 'unless' : 'if'
            }' element`
        );
    }
    const value = state.getValue();
    if (hasEqual) {
        const equalValue = props.equal;
        const equalState = new State(isUnless ? value != equalValue : value == equalValue);
        if (isUnless) {
            state.onChange((next) => equalState.setValue(next != equalValue));
        } else {
            state.onChange((next) => equalState.setValue(next == equalValue));
        }
        return equalState;
    } else if (isUnless) {
        const condition = new State(!value);
        state.onChange((next) => condition.setValue(!next));
        return condition;
    } else {
        return state as State<boolean>;
    }
}

export default function ControlState(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const state = statify(props, params);
    const elements = render(children, params, _super);
    let subscription: StateSubscription<boolean>;
    const mounter = createMounter('cs', component, {
        preventDismount: () => !state.getValue(),
        onMount() {
            if (state.getValue()) {
                mounter.mount(elements);
            }
            subscription = state.onChange((active) => {
                if (active) {
                    mounter.mount(elements);
                } else {
                    mounter.dismount();
                }
            });
        },
        onDismount() {
            subscription?.unsub?.();
        }
    });
    return mounter.rendered;
}

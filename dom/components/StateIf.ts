import { State, StateSubscription } from '@aldinh777/reactive';
import { isState } from '@aldinh777/reactive-utils/validator';
import { has } from '@aldinh777/toolbox/object/validate';
import { Properties } from '../../common/types';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

function statify(props: Properties, params: Properties): State<boolean> {
    const isUnless = has(props, 'rev');
    const hasEqual = has(props, 'equal');
    const valueName = props.value as string;
    let state: State = params[valueName] as State;
    if (!isState(state)) {
        throw new ComponentError(
            `'${valueName}' are not a valid State in 'state:value' property of '${
                isUnless ? 'unless' : 'if'
            }' element`
        );
    }
    if (hasEqual) {
        const equalValue = props.equal;
        const equalState = new State(state.getValue() == equalValue);
        state.onChange((next) => next === equalValue);
        state = equalState;
    }
    if (isUnless) {
        const reverse = new State(!state.getValue());
        state.onChange((next) => reverse.setValue(!next));
        state = reverse;
    }
    return state as State<boolean>;
}

export default function StateIf(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
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

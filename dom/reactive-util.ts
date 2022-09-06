import { State } from '@aldinh777/reactive/state/State';

export function stateToggle(initial: boolean) {
    const state = new State(initial);
    const open = () => state.setValue(true);
    const close = () => state.setValue(false);
    const toggle = () => state.setValue(!state.getValue());
    return [state, open, close, toggle];
}

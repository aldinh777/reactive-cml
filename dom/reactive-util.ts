import { state } from '@aldinh777/reactive';

export function stateToggle(initial: boolean) {
    const st = state(initial);
    const open = () => st.setValue(true);
    const close = () => st.setValue(false);
    const toggle = () => st.setValue(!st.getValue());
    return [st, open, close, toggle];
}

export function stateLocalStorage(key: string, initial: string) {
    const st = state(initial);
    const local = localStorage.getItem(key);
    if (local) {
        st.setValue(local);
    } else {
        localStorage.setItem(key, st.getValue());
    }
    st.onChange((value) => localStorage.setItem(key, value));
    return st;
}

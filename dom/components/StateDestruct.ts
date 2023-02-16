import { StateSubscription } from '@aldinh777/reactive';
import { isState } from '@aldinh777/reactive-utils/validator';
import { Properties } from '../../common/types';
import { PropAlias, readAlias, propAlias } from '../../common/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

export default function StateDestruct(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    if (!isState<object | Map<string, any>>(obj)) {
        throw new ComponentError(
            `'${props.obj}' are not a valid State in 'state:obj' property of 'destruct' element`
        );
    }
    let subscription: StateSubscription<object | Map<string, any>>;
    const mounter = createMounter('ds', component, {
        onMount() {
            const destructParams = propAlias(params, propnames, obj.getValue());
            const elements = render(children, destructParams, _super);
            mounter.mount(elements);
            subscription = obj.onChange((ob) => {
                const destructParams = propAlias(params, propnames, ob);
                const newElements = render(children, destructParams, _super);
                mounter.dismount();
                mounter.mount(newElements);
            });
        },
        onDismount() {
            subscription?.unsub?.();
        }
    });
    return mounter.rendered;
}

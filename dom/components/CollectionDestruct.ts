import { isMap } from '@aldinh777/reactive-utils/validator';
import { StateCollection, OperationHandler } from '@aldinh777/reactive/collection';
import { Subscription } from '@aldinh777/reactive/helper/subscription-helper';
import { Properties } from '../../common/types';
import { PropAlias, readAlias, propAlias } from '../../common/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

export default function CollectionDestruct(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    if (!isMap(obj)) {
        throw new ComponentError(
            `'${props.obj}' are not a valid StateCollection in 'collect:obj' property of 'destruct' element`
        );
    }
    let updateSubscription: Subscription<
        StateCollection<string, unknown, Map<string, unknown>>,
        OperationHandler<string, unknown>
    >;
    const mounter = createMounter('dc', component, {
        onMount() {
            const destructParams = propAlias(params, propnames, obj.raw);
            const elements = render(children, destructParams, _super);
            mounter.mount(elements);
            updateSubscription = obj.onUpdate(() => {
                const destructParams = propAlias(params, propnames, obj.raw);
                const newElements = render(children, destructParams, _super);
                mounter.dismount();
                mounter.mount(newElements);
            });
        },
        onDismount() {
            updateSubscription?.unsub?.();
        }
    });
    return mounter.rendered;
}

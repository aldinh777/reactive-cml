import { isMap } from '@aldinh777/reactive-utils/validator';
import { Properties } from '../../common/types';
import { PropAlias, readAlias, propAlias } from '../../common/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

export default async function CollectionDestruct(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
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
    const mounter = createMounter('dc', component, {
        async onMount() {
            const destructParams = propAlias(params, propnames, obj.raw);
            const elements = render(children, destructParams, _super);
            mounter.mount(await elements);
            const updateSubscription = obj.onUpdate(async () => {
                const destructParams = propAlias(params, propnames, obj.raw);
                const newElements = await render(children, destructParams, _super);
                mounter.dismount();
                mounter.mount(newElements);
            });
            return () => updateSubscription.unsub();
        }
    });
    return mounter.rendered;
}

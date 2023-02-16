import { StateSubscription } from '@aldinh777/reactive';
import { isState } from '@aldinh777/reactive-utils/validator';
import { Properties } from '../../common/types';
import { PropAlias, propAlias, readAlias } from '../../common/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

function createFlatListElement(
    alias: string,
    extract: PropAlias[],
    items: any[],
    component: Component
): RenderedResult[] {
    const components: RenderedResult[] = [];
    const { children, params, _super } = component;
    for (const item of items) {
        const localParams = propAlias(params, extract, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        components.push(...render(children, localParams, _super));
    }
    return components;
}

export default function StateForeach(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const list = component.params[props.list];
    const alias = props.as as string;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isState<any[]>(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid State in 'state:list' property of 'foreach' element`
        );
    }
    let subscription: StateSubscription<any[]>;
    const mounter = createMounter('ls', component, {
        onMount() {
            const elements = createFlatListElement(alias, extracts, list.getValue(), component);
            mounter.mount(elements);
            subscription = list.onChange((items) => {
                const newElements = createFlatListElement(alias, extracts, items, component);
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

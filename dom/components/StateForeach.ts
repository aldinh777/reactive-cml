import { isState } from '@aldinh777/reactive-utils/validator';
import { Properties } from '../../common/types';
import { PropAlias, propAlias, readAlias } from '../../common/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { createMounter } from '../component-helper';

async function createFlatListElement(
    alias: string,
    extract: PropAlias[],
    items: any[],
    component: Component
): Promise<RenderedResult[]> {
    const components: RenderedResult[] = [];
    const { children, params, _super } = component;
    for (const item of items) {
        const localParams = propAlias(params, extract, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        components.push(...(await render(children, localParams, _super)));
    }
    return components;
}

export default async function StateForeach(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
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
    const mounter = createMounter('ls', component, {
        async onMount() {
            const elements = await createFlatListElement(
                alias,
                extracts,
                list.getValue(),
                component
            );
            mounter.mount(elements);
            const subscription = list.onChange(async (items) => {
                const newElements = await createFlatListElement(alias, extracts, items, component);
                mounter.dismount();
                mounter.mount(newElements);
            });
            return () => subscription.unsub();
        }
    });
    return mounter.rendered;
}

import { isState } from '@aldinh777/reactive-utils/validator';
import { PropAlias, propAlias, readAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { createMounter } from '../component-helper';

function createFlatListElement(
    alias: string,
    extract: PropAlias[],
    items: any[],
    component: Component
): RenderResult[] {
    const components: RenderResult[] = [];
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

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const list = component.params[props.list];
    const alias = props.as;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isState<any[]>(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid State in 'state:list' property of 'foreach' element`
        );
    }
    const mounter = createMounter('ls', component, {
        onMount() {
            const elements = createFlatListElement(alias, extracts, list.getValue(), component);
            mounter.mount(elements);
        }
    });
    list.onChange((items: any[]) => {
        if (mounter.isMounted) {
            const newElements = createFlatListElement(alias, extracts, items, component);
            mounter.dismount();
            mounter.mount(newElements);
        }
    });
    return mounter.rendered;
}

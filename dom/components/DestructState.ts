import { isState } from '@aldinh777/reactive-utils/validator';
import { PropAlias, readAlias, propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { createMounter } from '../component-helper';

export default function DestructState(
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
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
    const mounter = createMounter('ds', component, {
        onMount() {
            const destructParams = propAlias(params, propnames, obj.getValue());
            const elements = render(children, destructParams, _super);
            mounter.mount(elements);
        }
    });
    obj.onChange((ob: Properties<any> | Map<string, any>) => {
        if (mounter.isMounted) {
            const destructParams = propAlias(params, propnames, ob);
            const newElements = render(children, destructParams, _super);
            mounter.dismount();
            mounter.mount(newElements);
        }
    });
    return mounter.rendered;
}

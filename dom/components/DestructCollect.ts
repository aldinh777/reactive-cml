import { isMap } from '@aldinh777/reactive-utils/validator';
import { PropAlias, readAlias, propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { createMounter } from '../component-helper';

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
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
        onMount() {
            const destructParams = propAlias(params, propnames, obj.raw);
            const elements = render(children, destructParams, _super);
            mounter.mount(elements);
        }
    });
    obj.onUpdate(() => {
        if (mounter.isMounted) {
            const destructParams = propAlias(params, propnames, obj.raw);
            const newElements = render(children, destructParams, _super);
            mounter.dismount();
            mounter.mount(newElements);
        }
    });
    return mounter.rendered;
}

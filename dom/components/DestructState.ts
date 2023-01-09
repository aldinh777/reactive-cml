import { isState } from '@aldinh777/reactive-utils/validator';
import { Context, NodeComponent, ControlComponent, intoDom } from '..';
import { _text, dismount, remove, mount, append } from '../dom-util';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util-type';

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    if (!isState(obj)) {
        throw new ComponentError(
            `'${props.obj}' are not a valid State in 'state:obj' property of 'destruct' element`
        );
    }
    let isMounted = false;
    const marker = _text('');
    const destructParams = propAlias(params, propnames, obj.getValue());
    const result: ControlComponent = {
        items: intoDom(children, destructParams, _super),
        mount: () => (isMounted = true),
        dismount: () => (isMounted = false)
    };
    obj.onChange((ob: Properties | Map<string, any>) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const destructParams = propAlias(params, propnames, ob);
        const elements = intoDom(children, destructParams, _super);
        if (isMounted) {
            dismount(parentNode, result.items);
            mount(parentNode, elements, marker);
        } else {
            remove(parentNode, result.items);
            append(parentNode, elements, marker);
        }
        result.items = elements;
    });
    return [result, marker];
}

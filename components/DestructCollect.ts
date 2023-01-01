import { isMap } from '@aldinh777/reactive-utils/validator';
import { Context, NodeComponent, ControlComponent, intoDom } from '../dom';
import { _text, dismount, remove, mount, append } from '../dom/dom-util';
import { PropAlias, readAlias, propAlias } from '../dom/prop-util';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
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
    let isMounted = false;
    const marker = _text('');
    const destructParams = propAlias(params, propnames, obj.raw);
    const result: ControlComponent = {
        items: intoDom(children, destructParams, _super),
        mount: () => (isMounted = true),
        dismount: () => (isMounted = false)
    };
    obj.onUpdate(() => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const destructParams = propAlias(params, propnames, obj.raw);
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

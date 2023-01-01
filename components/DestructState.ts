import { isState } from '@aldinh777/reactive-utils/validator';
import { Context, NodeComponent, ControlComponent, intoDom } from '../dom';
import { _text, remove, append } from '../dom/dom-util';
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
    if (!isState(obj)) {
        throw new ComponentError(
            `'${props.obj}' are not a valid State in 'state:obj' property of 'destruct' element`
        );
    }
    const marker = _text('');
    const destructParams = propAlias(params, propnames, obj.getValue());
    const result: ControlComponent = {
        items: intoDom(children, destructParams, _super)
    };
    obj.onChange((ob: Properties | Map<string, any>) => {
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        remove(parentNode, result.items);
        const destructParams = propAlias(params, propnames, ob);
        const destructElements = intoDom(children, destructParams, _super);
        append(parentNode, destructElements, marker);
        result.items = destructElements;
    });
    return [result, marker];
}

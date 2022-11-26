import { State } from '@aldinh777/reactive';
import { Context, NodeComponent, ControlComponent, intoDom } from '..';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util';
import { remove, insertBefore, _text } from '../dom-util';
import { PropAlias, readAlias, propAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { slots, params, _super } = context;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    if (!(obj instanceof State)) {
        throw ComponentError.invalidState('DestructState', 'destruct', 'obj', props.obj);
    }
    const marker = _text('');
    const destructParams = propAlias(params, propnames, obj.getValue());
    const component: ControlComponent = {
        elems: intoDom(slots._children, destructParams, _super)
    };
    obj.onChange((ob) => {
        const { elems } = component;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        remove(parentNode, elems);
        const destructParams = propAlias(params, propnames, ob);
        const destructElements = intoDom(slots._children, destructParams, _super);
        insertBefore(parentNode, destructElements, marker);
        component.elems = destructElements;
    });
    return [component, marker];
}

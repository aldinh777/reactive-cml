import { StateMap } from '@aldinh777/reactive/collection';
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
    if (!(obj instanceof StateMap)) {
        throw ComponentError.invalidCollect('DestructCollect', 'destruct', 'obj', props.obj);
    }
    const marker = _text('');
    const destructParams = propAlias(params, propnames, obj.raw);
    const component: ControlComponent = {
        elems: intoDom(slots._children, destructParams, _super)
    };
    obj.onUpdate(() => {
        const { parentNode } = marker;
        if (parentNode) {
            const destructParams = propAlias(params, propnames, obj.raw);
            const newElems = intoDom(slots._children, destructParams, _super);
            remove(parentNode, component.elems);
            insertBefore(parentNode, newElems, marker);
            component.elems = newElems;
        }
    });
    return [component, marker];
}

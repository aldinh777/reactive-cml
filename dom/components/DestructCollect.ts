import { StateMap } from '@aldinh777/reactive/collection';
import { Context, NodeComponent, ControlComponent, intoDom } from '..';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import { PropAlias, readAlias, propAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.obj !== 'string' || typeof props.as !== 'string') {
        return;
    }
    const { tree, params, _super } = context;
    const obj: any = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.as);
    if (!(obj instanceof StateMap)) {
        throw ComponentError.invalidCollect('DestructCollect', 'destruct', 'obj', props.obj);
    }
    const marker = document.createTextNode('');
    const destructParams = propAlias(params, propnames, obj.raw);
    const component: ControlComponent = {
        elems: intoDom(tree, destructParams, _super)
    };
    obj.onUpdate(() => {
        const { parentNode } = marker;
        if (parentNode) {
            const destructParams = propAlias(params, propnames, obj.raw);
            const newElems = intoDom(tree, destructParams, _super);
            remove(parentNode, component.elems);
            insertBefore(parentNode, newElems, marker);
            component.elems = newElems;
        }
    });
    return [component, marker];
}

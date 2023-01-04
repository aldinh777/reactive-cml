import { Context, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';

export default function (_props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    return intoDom(component.children, component.params, component._super);
}
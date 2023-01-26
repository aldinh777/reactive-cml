import { State } from '@aldinh777/reactive';
import { Properties } from '../common/types';

export type RCElementChildren = RCElement | State<any> | string;

export interface RCElement {
    tag: string;
    props: Properties<any>;
    events: Properties<Function>;
    children: RCElementChildren[];
}

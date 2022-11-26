export const TAG_IF = 'if';
export const TAG_UNLESS = 'unless';
export const TAG_FOREACH = 'foreach';
export const TAG_DESTRUCT = 'destruct';
export const TAG_CHILDREN = 'children';

export const BINDER_STATE = 'state';
export const BINDER_COLLECTION = 'collect';

export const PROP_CONTROL_VALUE = 'value';
export const PROP_CONTROL_OBJECT = 'obj';
export const PROP_CONTROL_LIST = 'list';
export const PROP_CONTROL_AS = 'as';
export const PROP_CONTROL_EXTRACT = 'extract';

export const PROP_STATE_VALUE = BINDER_STATE + ':' + PROP_CONTROL_VALUE;
export const PROP_STATE_OBJECT = BINDER_STATE + ':' + PROP_CONTROL_OBJECT;
export const PROP_STATE_LIST = BINDER_STATE + ':' + PROP_CONTROL_LIST;
export const PROP_COLLECTION_OBJECT = BINDER_COLLECTION + ':' + PROP_CONTROL_OBJECT;
export const PROP_COLLECTION_LIST = BINDER_COLLECTION + ':' + PROP_CONTROL_LIST;

export const COMPONENT_CONTROL_BASIC = 'ControlBasic';
export const COMPONENT_CONTROL_STATE = 'ControlState';
export const COMPONENT_DESTRUCT_BASIC = 'DestructBasic';
export const COMPONENT_DESTRUCT_STATE = 'DestructState';
export const COMPONENT_DESTRUCT_COLLECTION = 'DestructCollect';
export const COMPONENT_LIST_BASIC = 'LoopBasic';
export const COMPONENT_LIST_STATE = 'LoopState';
export const COMPONENT_LIST_COLLECTION = 'LoopCollect';
export const COMPONENT_CHILDREN = 'Children';

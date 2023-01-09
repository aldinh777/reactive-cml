export const TAG_IF = 'if';
export const TAG_UNLESS = 'unless';
export const TAG_FOREACH = 'foreach';
export const TAG_DESTRUCT = 'destruct';
export const TAG_CHILDREN = 'children';
export const TAG_SLOT = 'slot';
export const TAG_COMPONENT = 'component';

export const BINDER_STATE = 'state';
export const BINDER_COLLECTION = 'collect';

export const PROP_CONTROL_VALUE = 'value';
export const PROP_CONTROL_OBJECT = 'obj';
export const PROP_CONTROL_LIST = 'list';
export const PROP_CONTROL_AS = 'as';
export const PROP_CONTROL_EXTRACT = 'extract';
export const PROP_CONTROL_EXPORT = 'export';

export const PROP_STATE_VALUE = BINDER_STATE + ':' + PROP_CONTROL_VALUE;
export const PROP_STATE_OBJECT = BINDER_STATE + ':' + PROP_CONTROL_OBJECT;
export const PROP_STATE_LIST = BINDER_STATE + ':' + PROP_CONTROL_LIST;
export const PROP_COLLECTION_OBJECT = BINDER_COLLECTION + ':' + PROP_CONTROL_OBJECT;
export const PROP_COLLECTION_LIST = BINDER_COLLECTION + ':' + PROP_CONTROL_LIST;

export const TYPE_ATTR_ASSIGNMENT = 1;
export const TYPE_LITERAL_ASSIGNMENT = 2;
export const TYPE_EXPRESSION_ASSIGNMENT = 3;
export const TYPE_OBJECT_TEMPLATE = 4;

export const MAPPING_TYPE = {
  ATTR_ASSIGNMENT: TYPE_ATTR_ASSIGNMENT,
  LITERAL_ASSIGNMENT: TYPE_LITERAL_ASSIGNMENT,
  EXPRESSION_ASSIGNMENT: TYPE_EXPRESSION_ASSIGNMENT,
  OBJECT_TEMPLATE: TYPE_OBJECT_TEMPLATE,
};

export const ROOT_TYPES = {
  FLOW: 'flow',
  ACTIVITY: 'activity',
  TRIGGER: 'trigger',
  ERROR: 'error',
};

export const REGEX_INPUT_VALUE_INTERNAL = /^(([\w-]+)\.([\w-]+))((?:\.[\w-]+)*)$/;
export const REGEX_INPUT_VALUE_EXTERNAL = /^\{(A([\w-]+)|T|E)\.([\w-]+)\}((?:\.[\w-]+)*)$/;

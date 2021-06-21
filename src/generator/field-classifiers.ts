import { DTO_READ_ONLY } from './annotations';
import type { DMMF } from '@prisma/generator-helper';

export const isAnnotatedWith = (
  field: DMMF.Field,
  annotation: RegExp,
): boolean => {
  const { documentation = '' } = field;
  return annotation.test(documentation);
};

export const isAnnotatedWithOneOf = (
  field: DMMF.Field,
  annotations: RegExp[],
): boolean =>
  annotations.some((annotation) => isAnnotatedWith(field, annotation));

// Field properties
// isGenerated, !meaning unknown - assuming this means that the field itself is generated, not the value
// isId,
// isList,
// isReadOnly, !no idea how this is set
// isRequired, !seems to be `true` for 1-n relation
// isUnique, !is not set for `isId` fields
// isUpdatedAt, filled by prisma, should thus be readonly
// kind, scalar, object (relation), enum, unsupported
// name,
// type,
// dbNames, !meaning unknown
// hasDefaultValue,
// default: fieldDefault,
// documentation = '',
// relationName,
// relationFromFields,
// relationToFields,
// relationOnDelete,

interface FieldClassifierParam {
  field: DMMF.Field;
}

export const isId = ({ field }: FieldClassifierParam) => {
  return field.isId;
};

export const isRequired = ({ field }: FieldClassifierParam) => {
  return field.isRequired;
};

export const isScalar = ({ field }: FieldClassifierParam) => {
  return field.kind === 'scalar';
};

export const hasDefaultValue = ({ field }: FieldClassifierParam) => {
  return field.hasDefaultValue;
};

export const isUnique = ({ field }: FieldClassifierParam) => {
  return field.isUnique;
};

export const isRelation = ({ field }: FieldClassifierParam) => {
  const { kind /*, relationName */ } = field;
  // indicates a `relation` field
  return kind === 'object' /* && relationName */;
};

export const isIdWithDefaultValue = (param: FieldClassifierParam) =>
  isId(param) && hasDefaultValue(param);

/**
 * checks if a DMMF.Field either has `isReadOnly` property or is annotated with
 * `@DtoReadOnly` comment.
 *
 * **Note:** this also removes relation scalar fields as they are marked as `isReadOnly`
 *
 * @param {FieldClassifierParam} param
 * @returns {boolean}
 */
export const isReadOnly = ({ field }: FieldClassifierParam) =>
  field.isReadOnly || isAnnotatedWith(field, DTO_READ_ONLY);

export const isUpdatedAt = ({ field }: FieldClassifierParam) => {
  return field.isUpdatedAt;
};

/**
 * for schema-required fields that fallback to a default value when empty.
 *
 * Think: `createdAt` timestamps
 *
 * @example
 * ```prisma
 *  model Post {
 *    createdAt   DateTime @default(now())
 *  }
 *  ```
 */
export const isRequiredWithDefaultValue = (param: FieldClassifierParam) =>
  isRequired(param) && hasDefaultValue(param);

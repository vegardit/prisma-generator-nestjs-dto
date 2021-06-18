import { DTO_READ_ONLY } from './annotations';
import type { DMMF } from '@prisma/generator-helper';

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

export const isRelation = ({ field }: FieldClassifierParam) => {
  const { kind /*, relationName */ } = field;
  // indicates a `relation` field
  return kind === 'object' /* && relationName */;
};

export const isIdWithDefaultValue = ({ field }: FieldClassifierParam) => {
  const { isId, hasDefaultValue } = field;
  return isId && hasDefaultValue;
};

/**
 * checks if a DMMF.Field either has `isReadOnly` property or is annotated with
 * `@DtoReadOnly` comment.
 *
 * **Note:** this also removes relation scalar fields as they are marked as `isReadOnly`
 *
 * @param {FieldClassifierParam} param
 * @returns {boolean}
 */
export const isReadOnly = ({ field }: FieldClassifierParam) => {
  const { documentation = '' } = field;
  return field.isReadOnly || DTO_READ_ONLY.test(documentation);
};

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
export const isRequiredWithDefault = ({
  field: { isRequired, hasDefaultValue },
}: FieldClassifierParam) => isRequired && hasDefaultValue;

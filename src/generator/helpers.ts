import type { DMMF } from '@prisma/generator-helper';
import type { ParsedField } from './types';

const DTO_READ_ONLY = /@DtoReadOnly/;
const DTO_ENTITY_HIDDEN = /@DtoEntityHidden/;
const DTO_CREATE_OPTIONAL = /@DtoCreateOptional/;
const DTO_UPDATE_HIDDEN = /@DtoUpdateHidden/;
const DTO_UPDATE_OPTIONAL = /@DtoUpdateOptional/;
const DTO_RELATION_REQUIRED = /@DtoRelationRequired/;

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

const getRelationScalars = (fields: DMMF.Field[]): Record<string, string[]> => {
  const scalars = fields.flatMap(
    ({ relationFromFields = [] }) => relationFromFields,
  );
  return scalars.reduce(
    (result, scalar) => ({
      ...result,
      [scalar]: fields
        .filter(({ relationFromFields = [] }) =>
          relationFromFields.includes(scalar),
        )
        .map(({ name }) => name),
    }),
    {} as Record<string, string[]>,
  );
};

interface FieldClassifierParam {
  field: DMMF.Field;
}
interface WithRelationScalarFields {
  relationScalarFields: Set<string>;
}

const isRelation = ({ field }: FieldClassifierParam) => {
  const { kind /*, relationName */ } = field;
  // indicates a `relation` field
  return kind === 'object' /* && relationName */;
};

const isIdWithDefaultValue = ({ field }: FieldClassifierParam) => {
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
const isReadOnly = ({ field }: FieldClassifierParam) => {
  const { documentation = '' } = field;
  return field.isReadOnly || DTO_READ_ONLY.test(documentation);
};

const isUpdatedAt = ({ field }: FieldClassifierParam) => {
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
const isRequiredWithDefault = ({
  field: { isRequired, hasDefaultValue },
}: FieldClassifierParam) => isRequired && hasDefaultValue;

interface FilterFieldsForCreateDtoParam {
  fields: DMMF.Field[];
}
export const filterAndMapFieldsForCreateDto = ({
  fields,
}: FilterFieldsForCreateDtoParam): ParsedField[] => {
  const relationScalarFields = getRelationScalars(fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const filteredFields = fields.reduce((result, field) => {
    const { kind, name, type, documentation = '', isList } = field;

    if (isReadOnly({ field })) return result;
    if (isRelation({ field })) return result;
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in CreateDTO
    const isDtoOptional = DTO_CREATE_OPTIONAL.test(documentation);

    if (!isDtoOptional) {
      if (isIdWithDefaultValue({ field })) return result;
      if (isUpdatedAt({ field })) return result;
      if (isRequiredWithDefault({ field })) return result;
    }

    const isRequired = isDtoOptional ? false : field.isRequired;

    return [
      ...result,
      {
        kind,
        name,
        type,
        isRequired,
        isList,
        documentation,
      },
    ];
  }, [] as ParsedField[]);

  return filteredFields;
};

interface FilterFieldsForUpdateDtoParam {
  fields: DMMF.Field[];
}
export const filterAndMapFieldsForUpdateDto = ({
  fields,
}: FilterFieldsForUpdateDtoParam): ParsedField[] => {
  const relationScalarFields = getRelationScalars(fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const filteredFields = fields.reduce((result, field) => {
    const { kind, name, type, documentation = '', isId, isList } = field;

    if (DTO_UPDATE_HIDDEN.test(documentation)) return result;

    if (isReadOnly({ field })) return result;
    if (isId) return result;
    if (isRelation({ field })) return result;
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in CreateDTO
    const isDtoOptional = DTO_UPDATE_OPTIONAL.test(documentation);

    if (!isDtoOptional) {
      if (isUpdatedAt({ field })) return result;
    }

    return [
      ...result,
      {
        kind,
        name,
        type,
        isRequired: false,
        isList,
        documentation,
      },
    ];
  }, [] as ParsedField[]);

  return filteredFields;
};

interface FilterFieldsForEntityParam {
  fields: DMMF.Field[];
}
export const filterAndMapFieldsForEntity = ({
  fields,
}: FilterFieldsForEntityParam): ParsedField[] => {
  const relationScalarFields = getRelationScalars(fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const filteredFields = fields.reduce((result, field) => {
    const { kind, name, type, documentation = '', isList } = field;
    let isNullable = !field.isRequired;
    let isRequired = true;

    if (DTO_ENTITY_HIDDEN.test(documentation)) return result;

    // relation fields are never required in an entity.
    // they can however be `selected` and thus might optionally be included in the
    // response from PrismaClient
    if (isRelation({ field })) {
      isRequired = false;
      isNullable = field.isList
        ? false
        : field.isRequired
        ? false
        : !DTO_RELATION_REQUIRED.test(documentation);
    }

    if (relationScalarFieldNames.includes(name)) {
      const { [name]: relationNames } = relationScalarFields;
      const isAnyRelationRequired = relationNames.some((relationFieldName) => {
        const relationField = fields.find(
          (anyField) => anyField.name === relationFieldName,
        );
        if (!relationField) return false;

        return (
          relationField.isRequired ||
          DTO_RELATION_REQUIRED.test(relationField.documentation || '')
        );
      });

      isNullable = !isAnyRelationRequired
    }

    return [
      ...result,
      {
        kind,
        name,
        type,
        isRequired,
        isList,
        isNullable,
        documentation,
      },
    ];
  }, [] as ParsedField[]);

  return filteredFields;
};

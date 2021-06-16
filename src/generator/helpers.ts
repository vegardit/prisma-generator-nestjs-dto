import type { DMMF } from '@prisma/generator-helper';

const DTO_READ_ONLY = /@DtoReadOnly/;
const DTO_IS_GENERATED = /@DtoIsGenerated/;

const getRelationScalarFields = (fields: DMMF.Field[]) =>
  new Set(fields.flatMap(({ relationFromFields = [] }) => relationFromFields));

interface FilterFieldsParam {
  fields: DMMF.Field[];
  keepReadOnly: boolean;
  keepRelations: boolean;
  keepRelationScalarFields: boolean;
  keepId: boolean;
  keepUpdatedAt: boolean;
}
export const filterFields = ({
  fields,
  keepReadOnly,
  keepRelations,
  keepRelationScalarFields,
  keepId,
  keepUpdatedAt,
}: FilterFieldsParam) => {
  let result = [...fields];

  if (!keepReadOnly) {
    result = result.filter(
      ({ isReadOnly, documentation = '' }) =>
        !(isReadOnly || DTO_READ_ONLY.test(documentation)),
    );
  }

  if (!keepRelations) {
    result = result.filter(
      ({ kind, relationName }) => !(kind === 'object' && relationName),
    );
  }

  if (!keepRelationScalarFields) {
    const relationScalarFields = getRelationScalarFields(fields);

    result = result.filter(
      ({ kind, name }) =>
        !(kind === 'scalar' && relationScalarFields.has(name)),
    );
  }

  if (!keepId) {
    /**
     * removes all fields where `isId` is true AND either `hasDefaultValue` is
     * true or the field documentation contains `@DtoIsGenerated`.
     * We explicitly check for the default value (or @DtoIsGenerated) because
     * we don't want (Create|Update)DTOs to omit `id` fields when there is no
     * value automatically created for it.
     */
    result = result.filter(
      ({ isId, hasDefaultValue, documentation = '' }) =>
        !(isId && (hasDefaultValue || DTO_IS_GENERATED.test(documentation))),
    );
  }

  if (!keepUpdatedAt) {
    result = result.filter(({ isUpdatedAt }) => !isUpdatedAt);
  }

  return result;
};

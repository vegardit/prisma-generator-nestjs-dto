import type { DMMF } from '@prisma/generator-helper';

const READ_ONLY = /@DtoReadOnly/;
const IS_GENERATED = /@DtoIsGenerated/;

interface FilterFieldsParam {
  fields: DMMF.Field[];
  keepReadOnly: boolean;
  keepRelations: boolean;
  keepRelationFromFields: boolean;
  keepId: boolean;
  keepUpdatedAt: boolean;
}
export const filterFields = ({
  fields,
  keepReadOnly,
  keepRelations,
  keepRelationFromFields,
  keepId,
  keepUpdatedAt,
}: FilterFieldsParam) => {
  let result = [...fields];

  if (!keepReadOnly) {
    result = result.filter(
      ({ isReadOnly, documentation = '' }) =>
        !(isReadOnly || READ_ONLY.test(documentation)),
    );
  }

  if (!keepRelations) {
    result = result.filter(
      ({ kind, relationName }) => !(kind === 'object' && relationName),
    );
  }

  if (!keepRelationFromFields) {
    const uniqueRelationFromFields = fields.reduce((result, field) => {
      const { relationFromFields = [] } = field;
      relationFromFields.forEach((name) => result.add(name));
      return result;
    }, new Set<string>());

    result = result.filter(
      ({ kind, name }) =>
        !(kind === 'scalar' && uniqueRelationFromFields.has(name)),
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
        !(isId && (hasDefaultValue || IS_GENERATED.test(documentation))),
    );
  }

  if (!keepUpdatedAt) {
    result = result.filter(({ isUpdatedAt }) => !isUpdatedAt);
  }

  return result;
};

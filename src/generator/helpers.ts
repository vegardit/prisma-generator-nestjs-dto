import type { DMMF } from "@prisma/generator-helper";

interface FilterModelFieldsForClassParam {
  fields: DMMF.Field[];
  includeRelationFields?: boolean;
  includeRelationFromFields?: boolean;
}
export const filterModelFieldsForClass = ({
  fields,
  includeRelationFields = false,
  includeRelationFromFields = false,
}: FilterModelFieldsForClassParam) => {
  let result = fields;

  if (!includeRelationFields) {
    result = result.filter(
      ({ kind, relationName }) => !(kind === "object" && relationName)
    );
  }

  if (!includeRelationFromFields) {
    const uniqueRelationFromFields = fields.reduce((result, field) => {
      const { relationFromFields = [] } = field;
      relationFromFields.forEach((name) => result.add(name));
      return result;
    }, new Set<string>());

    result = result.filter(
      ({ kind, name }) =>
        !(kind === "scalar" && uniqueRelationFromFields.has(name))
    );
  }

  return result;
};

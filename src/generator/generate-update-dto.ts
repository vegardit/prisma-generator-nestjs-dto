import { getRelationScalars } from './helpers';
import { isReadOnly, isRelation, isUpdatedAt } from './field-classifiers';
import { DTO_UPDATE_HIDDEN, DTO_UPDATE_OPTIONAL } from './annotations';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import type { ParsedField } from './types';

interface FilterAndMapFieldsParam {
  fields: DMMF.Field[];
}
export const filterAndMapFields = ({
  fields,
}: FilterAndMapFieldsParam): ParsedField[] => {
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

interface GenerateUpdateDtoParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
}
export const generateUpdateDto = ({
  model,
  templateHelpers: t,
}: GenerateUpdateDtoParam) => {
  const enumsToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === 'enum')
        .map(({ type }) => type),
    ),
  );

  const fieldsToInclude = filterAndMapFields({
    fields: model.fields,
  });

  const template = `
${t.if(
  enumsToImport.length,
  `import { ${enumsToImport} } from '@prisma/client';`,
)}

export class ${t.updateDtoName(model.name)} {
  ${t.fieldsToDtoProps(fieldsToInclude, true, true)}
}
`;

  return template;
};

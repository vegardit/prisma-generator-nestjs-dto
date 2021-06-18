import { getRelationScalars } from './helpers';
import {
  isReadOnly,
  isRelation,
  isIdWithDefaultValue,
  isUpdatedAt,
  isRequiredWithDefault,
} from './field-classifiers';
import { DTO_CREATE_OPTIONAL } from './annotations';

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

interface GenerateCreateDtoParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
}
export const generateCreateDto = ({
  model,
  templateHelpers: t,
}: GenerateCreateDtoParam) => {
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

export class ${t.createDtoName(model.name)} {
  ${t.fieldsToDtoProps(fieldsToInclude, true)}
}
`;

  return template;
};

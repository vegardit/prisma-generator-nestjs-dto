import { filterFields } from './helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import { inspect } from 'util';

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

  const fieldsToInclude = filterFields({
    fields: model.fields,
    keepReadOnly: false,
    keepRelations: false,
    keepRelationScalarFields: false,
    keepId: false,
    keepUpdatedAt: false,
  });

  const template = `
import { Prisma } from '@prisma/client';
${t.importEnums(enumsToImport)}

export class ${t.createDtoName(model.name)} implements Prisma.${
    model.name
  }CreateInput {
  ${t.fieldsToDtoProps(fieldsToInclude, true)}
}

const fields = [${model.fields.map((field) => inspect(field))}];
`;

  return template;
};

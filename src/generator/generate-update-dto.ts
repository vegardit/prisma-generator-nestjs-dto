import { filterFields } from './helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';

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

export class ${t.updateDtoName(model.name)} implements Prisma.${
    model.name
  }UpdateInput {
  ${t.fieldsToDtoProps(fieldsToInclude, true, true)}
}
`;

  return template;
};

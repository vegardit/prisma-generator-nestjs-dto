import { filterAndMapFieldsForCreateDto } from './helpers';

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

  const fieldsToInclude = filterAndMapFieldsForCreateDto({
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

const fields = [${model.fields.map((field) => inspect(field))}];
`;

  return template;
};

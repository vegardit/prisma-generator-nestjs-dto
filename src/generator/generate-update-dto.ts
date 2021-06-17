import { filterAndMapFieldsForUpdateDto } from './helpers';

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

  const fieldsToInclude = filterAndMapFieldsForUpdateDto({
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

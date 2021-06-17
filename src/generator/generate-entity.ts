import { filterAndMapFieldsForEntity } from './helpers';
import { scalarToTS } from './template-helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';

interface GenerateEntityParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
  keepRelations: boolean;
  keepRelationScalarFields: boolean;
}
export const generateEntity = ({
  model,
  templateHelpers: t,
}: GenerateEntityParam) => {
  const importPrisma = model.fields
    .filter(({ kind }) => kind === 'scalar')
    .some(({ type }) => scalarToTS(type).includes('Prisma'));

  const entitiesToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === 'object')
        // removes fields representing a [self-relation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#self-relations)
        .filter(({ type }) => type !== model.name)
        .map(({ type }) => type),
    ),
  );

  const enumsToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === 'enum')
        .map(({ type }) => type),
    ),
  );

  const fieldsToInclude = filterAndMapFieldsForEntity({
    fields: model.fields,
  });

  const template = `
  ${t.if(
    importPrisma || enumsToImport.length,
    `import { ${t.if(
      importPrisma,
      'Prisma,',
    )} ${enumsToImport} } from '@prisma/client';`,
  )}

${t.if(
  entitiesToImport.length,
  "import { ApiExtraModels } from '@nestjs/swagger';",
)}

${t.importEntities(entitiesToImport)}

${t.if(entitiesToImport.length, t.apiExtraModels(entitiesToImport))}
export class ${t.entityName(model.name)} {
  ${t.fieldsToEntityProps(fieldsToInclude)}
}
`;

  return template;
};

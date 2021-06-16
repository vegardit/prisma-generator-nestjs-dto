import { filterFields } from './helpers';
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
  keepRelations,
  keepRelationScalarFields,
  templateHelpers: t,
}: GenerateEntityParam) => {
  const importPrisma = model.fields
    .filter(({ kind }) => kind === 'scalar')
    .some(({ type }) => scalarToTS(type).includes('Prisma'));

  const entitiesToImport = keepRelations
    ? Array.from(
        new Set(
          model.fields
            .filter(({ kind }) => kind === 'object')
            // removes fields representing a [self-relation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#self-relations)
            .filter(({ type }) => type !== model.name)
            .map(({ type }) => type),
        ),
      )
    : [];

  const enumsToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === 'enum')
        .map(({ type }) => type),
    ),
  );

  const fieldsToInclude = filterFields({
    fields: model.fields,
    keepReadOnly: true,
    keepId: true,
    keepUpdatedAt: true,
    keepRelations: keepRelations,
    keepRelationScalarFields: keepRelationScalarFields,
  });

  const template = `
import { ${t.if(importPrisma, 'Prisma,')} ${model.name} as ${
    model.name
  }Type } from '@prisma/client';
${t.if(keepRelations, "import { ApiExtraModels } from '@nestjs/swagger';")}

${t.importEntities(entitiesToImport)}
${t.importEnums(enumsToImport)}

${t.if(
  keepRelations && entitiesToImport.length,
  t.apiExtraModels(entitiesToImport),
)}
export class ${t.entityName(model.name)} implements ${model.name}Type{
  ${t.fieldsToEntityProps(fieldsToInclude)}
}
`;

  return template;
};

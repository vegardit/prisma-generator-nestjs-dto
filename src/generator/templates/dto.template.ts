import { filterFields } from '../helpers';
import { scalarToTS } from '../template-helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';
import { inspect } from 'util';

interface MakeCreateDtoParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
}
export const makeCreateDto = ({
  model,
  templateHelpers: t,
}: MakeCreateDtoParam) => {
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
    keepRelationFromFields: false,
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

interface MakeUpdateDtoParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
}
export const makeUpdateDto = ({
  model,
  templateHelpers: t,
}: MakeUpdateDtoParam) => {
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
    keepRelationFromFields: false,
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

interface MakeEntityParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
  includeRelations: boolean;
  includeRelationFromFields: boolean;
}
export const makeEntity = ({
  model,
  includeRelations,
  includeRelationFromFields,
  templateHelpers: t,
}: MakeEntityParam) => {
  const importPrisma = model.fields
    .filter(({ kind }) => kind === 'scalar')
    .some(({ type }) => scalarToTS(type).includes('Prisma'));

  const entitiesToImport = includeRelations
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
    keepRelations: includeRelations,
    keepRelationFromFields: includeRelationFromFields,
  });

  const template = `
import { ${t.if(importPrisma, 'Prisma,')} ${model.name} as ${
    model.name
  }Type } from '@prisma/client';
${t.if(includeRelations, "import { ApiExtraModels } from '@nestjs/swagger';")}

${t.importEntities(entitiesToImport)}
${t.importEnums(enumsToImport)}

${t.if(
  includeRelations && entitiesToImport.length,
  t.apiExtraModels(entitiesToImport),
)}
export class ${t.entityName(model.name)} implements ${model.name}Type{
  ${t.fieldsToEntityProps(fieldsToInclude)}
}
`;

  return template;
};

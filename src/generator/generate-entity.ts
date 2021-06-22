import { scalarToTS } from './template-helpers';
import { getRelationScalars, mapDMMFToParsedField } from './helpers';
import { isAnnotatedWith, isRelation, isRequired } from './field-classifiers';
import { DTO_ENTITY_HIDDEN, DTO_RELATION_REQUIRED } from './annotations';

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
    const { name } = field;
    const overrides: Partial<DMMF.Field> = { isNullable: !field.isRequired };

    if (isAnnotatedWith(field, DTO_ENTITY_HIDDEN)) return result;

    // relation fields are never required in an entity.
    // they can however be `selected` and thus might optionally be included in the
    // response from PrismaClient
    if (isRelation(field)) {
      overrides.isRequired = false;
      overrides.isNullable = field.isList
        ? false
        : field.isRequired
        ? false
        : !isAnnotatedWith(field, DTO_RELATION_REQUIRED);
    }

    if (relationScalarFieldNames.includes(name)) {
      const { [name]: relationNames } = relationScalarFields;
      const isAnyRelationRequired = relationNames.some((relationFieldName) => {
        const relationField = fields.find(
          (anyField) => anyField.name === relationFieldName,
        );
        if (!relationField) return false;

        return (
          isRequired(relationField) ||
          isAnnotatedWith(relationField, DTO_RELATION_REQUIRED)
        );
      });

      overrides.isNullable = !isAnyRelationRequired;
    }

    return [...result, mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  return filteredFields;
};

interface GenerateEntityParam {
  model: DMMF.Model;
  templateHelpers: TemplateHelpers;
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

  const fieldsToInclude = filterAndMapFields({
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

  ${t.importEntities(entitiesToImport)}

export class ${t.entityName(model.name)} {
  ${t.fieldsToEntityProps(fieldsToInclude)}
}
`;

  return template;
};

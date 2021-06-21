import {
  generateRelationInputType,
  getRelationScalars,
  mapDMMFToParsedField,
} from './helpers';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isId,
  isReadOnly,
  isRelation,
  isUpdatedAt,
} from './field-classifiers';
import {
  DTO_RELATION_MODIFIERS_ON_UPDATE,
  DTO_RELATION_CAN_CONNECT_ON_UPDATE,
  DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
  DTO_UPDATE_HIDDEN,
  DTO_UPDATE_OPTIONAL,
  DTO_CREATE_OPTIONAL,
} from './annotations';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import type { ExtraModel, ParsedField } from './types';

interface FilterAndMapFieldsParam {
  fields: DMMF.Field[];
  model: DMMF.Model;
  allModels: DMMF.Model[];
  templateHelpers: TemplateHelpers;
}
export const filterAndMapFields = ({
  fields,
  model,
  allModels,
  templateHelpers,
}: FilterAndMapFieldsParam): {
  filteredFields: ParsedField[];
  extraModels: ExtraModel[];
  generatedClasses: string[];
} => {
  const relationScalarFields = getRelationScalars(fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const extraModels: ExtraModel[] = [];
  const generatedClasses: string[] = [];

  const filteredFields = fields.reduce((result, field) => {
    const { name } = field;
    const overrides: Partial<DMMF.Field> = {
      isRequired: false,
    };

    if (isAnnotatedWith(field, DTO_UPDATE_HIDDEN)) return result;

    if (isReadOnly({ field })) return result;
    if (isId({ field })) return result;
    if (isRelation({ field })) {
      if (!isAnnotatedWithOneOf(field, DTO_RELATION_MODIFIERS_ON_UPDATE)) {
        return result;
      }
      const relationInputType = generateRelationInputType({
        field,
        model,
        allModels,
        templateHelpers,
        preAndSuffixClassName: templateHelpers.updateDtoName,
        canCreateAnnotation: DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
        canConnectAnnotation: DTO_RELATION_CAN_CONNECT_ON_UPDATE,
      });

      overrides.type = relationInputType.type;
      overrides.isList = false;
      extraModels.unshift(...relationInputType.extraModels);
      generatedClasses.unshift(...relationInputType.generatedClasses);
    }
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in UpdateDTO
    const isDtoOptional = isAnnotatedWith(field, DTO_UPDATE_OPTIONAL);

    if (!isDtoOptional) {
      if (isUpdatedAt({ field })) return result;
    }

    return [...result, mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  return {
    filteredFields,
    extraModels: Array.from(new Set(extraModels)),
    generatedClasses,
  };
};

interface GenerateUpdateDtoParam {
  model: DMMF.Model;
  allModels: DMMF.Model[];
  exportRelationModifierClasses: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateUpdateDto = ({
  model,
  allModels,
  exportRelationModifierClasses,
  templateHelpers: t,
}: GenerateUpdateDtoParam) => {
  const enumsToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === 'enum')
        .map(({ type }) => type),
    ),
  );

  const { filteredFields, extraModels, generatedClasses } = filterAndMapFields({
    fields: model.fields,
    model,
    allModels,
    templateHelpers: t,
  });

  const extraModelNamesToImport = extraModels
    .filter(({ isLocal = false }) => !isLocal)
    .map(({ originalName }) => originalName);

  const extraModelNamesForApiDocs = extraModels.map(
    ({ preAndPostfixedName }) => preAndPostfixedName,
  );

  const template = `
${t.if(
  enumsToImport.length,
  `import { ${enumsToImport} } from '@prisma/client';`,
)}
${t.if(
  extraModelNamesToImport.length,
  "import { ApiExtraModels } from '@nestjs/swagger';",
)}

${t.importCreateDtos(extraModelNamesToImport)}

${t.each(
  generatedClasses,
  exportRelationModifierClasses ? (content) => `export ${content}` : t.echo,
  '\n',
)}

${t.if(extraModels.length, t.apiExtraModels(extraModelNamesForApiDocs))}
export class ${t.updateDtoName(model.name)} {
  ${t.fieldsToDtoProps(filteredFields, true, true)}
}
`;

  return template;
};

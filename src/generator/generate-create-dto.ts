import {
  getRelationScalars,
  generateRelationInputType,
  mapDMMFToParsedField,
} from './helpers';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isIdWithDefaultValue,
  isReadOnly,
  isRelation,
  isRequiredWithDefaultValue,
  isUpdatedAt,
} from './field-classifiers';
import {
  DTO_CREATE_OPTIONAL,
  DTO_RELATION_CAN_CONNECT_ON_CREATE,
  DTO_RELATION_CAN_CRAEATE_ON_CREATE,
  DTO_RELATION_MODIFIERS_ON_CREATE,
  DTO_RELATION_REQUIRED,
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
    const overrides: Partial<DMMF.Field> = {};

    if (isReadOnly({ field })) return result;
    if (isRelation({ field })) {
      if (!isAnnotatedWithOneOf(field, DTO_RELATION_MODIFIERS_ON_CREATE)) {
        return result;
      }
      const relationInputType = generateRelationInputType({
        field,
        model,
        allModels,
        templateHelpers,
        preAndSuffixClassName: templateHelpers.createDtoName,
        canCreateAnnotation: DTO_RELATION_CAN_CRAEATE_ON_CREATE,
        canConnectAnnotation: DTO_RELATION_CAN_CONNECT_ON_CREATE,
      });

      const isDtoRelationRequired = isAnnotatedWith(
        field,
        DTO_RELATION_REQUIRED,
      );
      if (isDtoRelationRequired) overrides.isRequired = true;

      overrides.type = relationInputType.type;
      overrides.isList = false;
      extraModels.unshift(...relationInputType.extraModels);
      generatedClasses.unshift(...relationInputType.generatedClasses);
    }
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in CreateDTO
    const isDtoOptional = isAnnotatedWith(field, DTO_CREATE_OPTIONAL);

    if (!isDtoOptional) {
      if (isIdWithDefaultValue({ field })) return result;
      if (isUpdatedAt({ field })) return result;
      if (isRequiredWithDefaultValue({ field })) return result;
    }
    if (isDtoOptional) {
      overrides.isRequired = false;
    }

    return [...result, mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  return {
    filteredFields,
    extraModels,
    generatedClasses,
  };
};

interface GenerateCreateDtoParam {
  model: DMMF.Model;
  allModels: DMMF.Model[];
  exportRelationModifierClasses: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateCreateDto = ({
  model,
  allModels,
  exportRelationModifierClasses,
  templateHelpers: t,
}: GenerateCreateDtoParam) => {
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
export class ${t.createDtoName(model.name)} {
  ${t.fieldsToDtoProps(filteredFields, true)}
}
`;

  return template;
};

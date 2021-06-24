import {
  DTO_CREATE_OPTIONAL,
  DTO_RELATION_CAN_CONNECT_ON_UPDATE,
  DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
  DTO_RELATION_MODIFIERS_ON_UPDATE,
  DTO_UPDATE_HIDDEN,
} from './annotations';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isId,
  isReadOnly,
  isRelation,
  isUpdatedAt,
} from './field-classifiers';
import {
  concatIntoArray,
  generateRelationInput,
  getRelationScalars,
  makeImportsFromPrismaClient,
  mapDMMFToParsedField,
} from './helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import type {
  UpdateDtoParams,
  ImportStatementParams,
  ParsedField,
} from './types';

interface ComputeUpdateDtoParamsParam {
  model: DMMF.Model;
  allModels: DMMF.Model[];
  templateHelpers: TemplateHelpers;
}
export const computeUpdateDtoParams = ({
  model,
  allModels,
  templateHelpers,
}: ComputeUpdateDtoParamsParam): UpdateDtoParams => {
  const imports: ImportStatementParams[] = [
    makeImportsFromPrismaClient(model),
    { from: '@nestjs/swagger', destruct: ['ApiExtraModels'] },
  ];

  const relationScalarFields = getRelationScalars(model.fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const extraClasses: string[] = [];
  const apiExtraModels: string[] = [];

  const fields = model.fields.reduce((result, field) => {
    const { name } = field;
    const overrides: Partial<DMMF.Field> = { isRequired: false };

    if (isAnnotatedWith(field, DTO_UPDATE_HIDDEN)) return result;

    if (isReadOnly(field)) return result;
    if (isId(field)) return result;
    if (isRelation(field)) {
      if (!isAnnotatedWithOneOf(field, DTO_RELATION_MODIFIERS_ON_UPDATE)) {
        return result;
      }
      const relationInputType = generateRelationInput({
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

      concatIntoArray(relationInputType.imports, imports);
      concatIntoArray(relationInputType.generatedClasses, extraClasses);
      concatIntoArray(relationInputType.apiExtraModels, apiExtraModels);
    }
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in CreateDTO
    const isDtoOptional = isAnnotatedWith(field, DTO_CREATE_OPTIONAL);

    if (!isDtoOptional) {
      if (isUpdatedAt(field)) return result;
    }

    return [...result, mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  return { model, fields, imports, extraClasses, apiExtraModels };
};

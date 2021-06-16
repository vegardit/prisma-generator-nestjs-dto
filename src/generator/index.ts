import { camel as transformCase } from 'case';
import { logger } from '@prisma/sdk';
import { makeHelpers } from './template-helpers';
import { generateCreateDto } from './generate-create-dto';
import { generateUpdateDto } from './generate-update-dto';
import { generateEntity } from './generate-entity';
import { generateEnum } from './generate-enum';

import type { DMMF } from '@prisma/generator-helper';

interface RunParam {
  dmmf: DMMF.Document;
  keepRelations: boolean;
  keepRelationScalarFields: boolean;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  enumPrefix: string;
  enumSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
}
export const run = ({ dmmf, ...options }: RunParam) => {
  const { keepRelations, keepRelationScalarFields, ...preAndSuffixes } =
    options;

  const templateHelpers = makeHelpers({
    transformCase,
    ...preAndSuffixes,
  });
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;

  const enumsFiles = enums.map((enumModel) => {
    const fileName = `${transformCase(enumModel.name)}.enum.ts`;
    const content = generateEnum({ enumModel, templateHelpers });

    return { fileName, content };
  });

  const modelFiles = models.map((model) => {
    logger.info(`Processing Model ${model.name}`);

    // generate create-model.dto.ts
    const createDto = {
      fileName: `create-${transformCase(model.name)}.dto.ts`,
      content: generateCreateDto({
        model,
        templateHelpers,
      }),
    };
    // TODO generate create-model.struct.ts

    // generate update-model.dto.ts
    const updateDto = {
      fileName: `update-${transformCase(model.name)}.dto.ts`,
      content: generateUpdateDto({
        model,
        templateHelpers,
      }),
    };
    // TODO generate update-model.struct.ts

    // generate model.entity.ts
    const entity = {
      fileName: `${transformCase(model.name)}.entity.ts`,
      content: generateEntity({
        model,
        templateHelpers,
        keepRelationScalarFields,
        keepRelations,
      }),
    };
    // TODO generate model.struct.ts

    return [createDto, updateDto, entity];
  });

  return [...modelFiles, ...enumsFiles].flat();
};

import { camel as transformCase } from 'case';
import { logger } from '@prisma/sdk';
import { makeHelpers } from './template-helpers';
import {
  makeCreateDto,
  makeUpdateDto,
  makeEntity,
} from './templates/dto.template';
import { createEnumTemplate } from './templates/enum.template';

import type { DMMF } from '@prisma/generator-helper';

interface RunParam {
  dmmf: DMMF.Document;
  includeRelations: boolean;
  includeRelationFromFields: boolean;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  enumPrefix: string;
  enumSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
}
export const run = ({ dmmf, ...options }: RunParam) => {
  const { includeRelations, includeRelationFromFields, ...preAndSuffixes } =
    options;

  const templateHelpers = makeHelpers({
    transformCase,
    ...preAndSuffixes,
  });
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;

  const enumsFiles = enums.map((enumModel) => {
    const fileName = `${transformCase(enumModel.name)}.enum.ts`;
    const content = createEnumTemplate({ enumModel, templateHelpers });

    return { fileName, content };
  });

  const modelFiles = models.map((model) => {
    logger.info(`Processing Model ${model.name}`);

    // make create-model.dto.ts
    const createDto = {
      fileName: `create-${transformCase(model.name)}.dto.ts`,
      content: makeCreateDto({
        model,
        templateHelpers,
      }),
    };
    // make create-model.struct.ts
    // make update-model.dto.ts
    const updateDto = {
      fileName: `update-${transformCase(model.name)}.dto.ts`,
      content: makeUpdateDto({
        model,
        templateHelpers,
      }),
    };
    // make update-model.struct.ts
    // make model.entity.ts
    const entity = {
      fileName: `${transformCase(model.name)}.entity.ts`,
      content: makeEntity({
        model,
        templateHelpers,
        includeRelationFromFields,
        includeRelations,
      }),
    };
    // make model.struct.ts

    return [createDto, updateDto, entity];
  });

  return [...modelFiles, ...enumsFiles].flat();
};

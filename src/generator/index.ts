import {
  camel as transformFileNameCase,
  pascal as transformClassNameCase,
} from 'case';
import { logger } from '@prisma/sdk';
import { makeHelpers } from './template-helpers';
import { generateCreateDto } from './generate-create-dto';
import { generateUpdateDto } from './generate-update-dto';
import { generateEntity } from './generate-entity';

import type { DMMF } from '@prisma/generator-helper';

interface RunParam {
  dmmf: DMMF.Document;
  exportRelationModifierClasses: boolean;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
}
export const run = ({ dmmf, ...options }: RunParam) => {
  const { exportRelationModifierClasses, ...preAndSuffixes } = options;

  const templateHelpers = makeHelpers({
    transformFileNameCase,
    transformClassNameCase,
    ...preAndSuffixes,
  });
  const allModels = dmmf.datamodel.models;

  const modelFiles = allModels.map((model) => {
    logger.info(`Processing Model ${model.name}`);

    // generate create-model.dto.ts
    const createDto = {
      fileName: `create-${transformFileNameCase(model.name)}.dto.ts`,
      content: generateCreateDto({
        model,
        allModels,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate create-model.struct.ts

    // generate update-model.dto.ts
    const updateDto = {
      fileName: `update-${transformFileNameCase(model.name)}.dto.ts`,
      content: generateUpdateDto({
        model,
        allModels,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate update-model.struct.ts

    // generate model.entity.ts
    const entity = {
      fileName: `${transformFileNameCase(model.name)}.entity.ts`,
      content: generateEntity({
        model,
        templateHelpers,
      }),
    };
    // TODO generate model.struct.ts

    return [createDto, updateDto, entity];
  });

  return [...modelFiles].flat();
};

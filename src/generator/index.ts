import {
  camel as transformFileNameCase,
  pascal as transformClassNameCase,
} from 'case';
import { logger } from '@prisma/sdk';
import { makeHelpers } from './template-helpers';
import { computeModelParams } from './compute-model-params';
import { generateConnectDto } from './generate-connect-dto';
import { generateCreateDto } from './generate-create-dto';
import { generateUpdateDto } from './generate-update-dto';
import { generateEntity } from './generate-entity';
import { DTO_IGNORE_MODEL } from './annotations';
import { isAnnotatedWith } from './field-classifiers';

import type { DMMF } from '@prisma/generator-helper';

interface RunParam {
  dmmf: DMMF.Document;
  exportRelationModifierClasses: boolean;
  connectDtoPrefix: string;
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

  const filteredModels = allModels.filter(
    (model) => !isAnnotatedWith(model, DTO_IGNORE_MODEL),
  );

  const modelFiles = filteredModels.map((model) => {
    logger.info(`Processing Model ${model.name}`);

    const modelParams = computeModelParams({
      model,
      allModels: filteredModels,
      templateHelpers,
    });

    // generate connect-model.dto.ts
    const connectDto = {
      fileName: templateHelpers.connectDtoFilename(model.name, true),
      content: generateConnectDto({
        ...modelParams.connect,
        templateHelpers,
      }),
    };

    // generate create-model.dto.ts
    const createDto = {
      fileName: templateHelpers.createDtoFilename(model.name, true),
      content: generateCreateDto({
        ...modelParams.create,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate create-model.struct.ts

    // generate update-model.dto.ts
    const updateDto = {
      fileName: templateHelpers.updateDtoFilename(model.name, true),
      content: generateUpdateDto({
        ...modelParams.update,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate update-model.struct.ts

    // generate model.entity.ts
    const entity = {
      fileName: templateHelpers.entityFilename(model.name, true),
      content: generateEntity({
        ...modelParams.entity,
        templateHelpers,
      }),
    };
    // TODO generate model.struct.ts

    return [connectDto, createDto, updateDto, entity];
  });

  return [...modelFiles].flat();
};

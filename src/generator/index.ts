import path from 'path';
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
import { DTO_IGNORE_MODEL, DTO_MODEL_NAME } from './annotations';
import { getAnnotationValue, isAnnotatedWith } from './field-classifiers';

import type { DMMF } from '@prisma/generator-helper';
import { Model, WriteableFileSpecs } from './types';

interface RunParam {
  output: string;
  dmmf: DMMF.Document;
  exportRelationModifierClasses: boolean;
  outputToNestJsResourceStructure: boolean;
  connectDtoPrefix: string;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
}
export const run = ({
  output,
  dmmf,
  ...options
}: RunParam): WriteableFileSpecs[] => {
  const {
    exportRelationModifierClasses,
    outputToNestJsResourceStructure,
    ...preAndSuffixes
  } = options;

  const templateHelpers = makeHelpers({
    transformFileNameCase,
    transformClassNameCase,
    ...preAndSuffixes,
  });
  const allModels = dmmf.datamodel.models;

  const filteredModels: Model[] = allModels
    .filter((model) => !isAnnotatedWith(model, DTO_IGNORE_MODEL))
    // adds `output` information for each model so we can compute relative import paths
    // this assumes that NestJS resource modules (more specifically their folders on disk) are named as `transformFileNameCase(model.name)`
    .map((model) => {
      const modelName = getAnnotationValue(model, DTO_MODEL_NAME) || model.name;
      model.plural = getAnnotationValue(model, DTO_MODEL_NAME) || model.name;
      return {
        ...model,
        output: {
          dto: outputToNestJsResourceStructure
            ? path.join(output, transformFileNameCase(modelName), 'dto')
            : output,
          entity: outputToNestJsResourceStructure
            ? path.join(output, transformFileNameCase(modelName), 'entities')
            : output,
        },
      };
    });

  const modelFiles = filteredModels.map((model) => {
    logger.info(`Processing Model ${model.name}`);

    const modelName = getAnnotationValue(model, DTO_MODEL_NAME) || model.name;

    const modelParams = computeModelParams({
      model,
      allModels: filteredModels,
      templateHelpers,
    });

    // generate connect-model.dto.ts
    const connectDto = {
      fileName: path.join(
        model.output.dto,
        templateHelpers.connectDtoFilename(modelName, true),
      ),
      content: generateConnectDto({
        ...modelParams.connect,
        templateHelpers,
      }),
    };

    // generate create-model.dto.ts
    const createDto = {
      fileName: path.join(
        model.output.dto,
        templateHelpers.createDtoFilename(modelName, true),
      ),
      content: generateCreateDto({
        ...modelParams.create,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate create-model.struct.ts

    // generate update-model.dto.ts
    const updateDto = {
      fileName: path.join(
        model.output.dto,
        templateHelpers.updateDtoFilename(modelName, true),
      ),
      content: generateUpdateDto({
        ...modelParams.update,
        exportRelationModifierClasses,
        templateHelpers,
      }),
    };
    // TODO generate update-model.struct.ts

    // generate model.entity.ts
    const entity = {
      fileName: path.join(
        model.output.entity,
        templateHelpers.entityFilename(modelName, true),
      ),
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

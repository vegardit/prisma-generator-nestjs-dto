import * as path from 'path';
import fs from 'fs/promises';
import { camel as transformCase } from 'case';
import { logger } from '@prisma/sdk';
import { createDtoTemplate } from './templates/dto.template';
import { createEnumTemplate } from './templates/enum.template';

import type { DMMF } from '@prisma/generator-helper';
import type { GenerateCodeOptions } from './options';

export const generateCode = (
  dmmf: DMMF.Document,
  options: GenerateCodeOptions,
) => {
  const results = createServicesFromModels(dmmf, options);

  return Promise.all(
    results.map(({ fileName, content }) => fs.writeFile(fileName, content)),
  );
};

function createServicesFromModels(
  dmmf: DMMF.Document,
  options: GenerateCodeOptions,
) {
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;
  const {
    output,
    includeRelationFields,
    includeRelationFromFields,
    ...preAndSuffixes
  } = options;

  const enumsFiles = enums.map((enumModel) => {
    const fileName = path.join(
      output,
      `${transformCase(enumModel.name)}.enum.ts`,
    );
    const content = createEnumTemplate({ enumModel, ...preAndSuffixes });

    return { fileName, content };
  });

  const modelFiles = models
    // .filter(({ name }) => name === "Question")
    .map((model) => {
      logger.info(`Processing Model ${model.name}`);
      const fileName = path.join(output, `${transformCase(model.name)}.dto.ts`);

      const content = createDtoTemplate({
        model,
        ...preAndSuffixes,
        includeRelationFields,
        includeRelationFromFields,
        transformCase,
      });

      return { fileName, content };
    });

  return [...modelFiles, ...enumsFiles];
}

import fs from 'fs/promises';
import * as path from 'path';
import { generatorHandler } from '@prisma/generator-helper';
import { parseEnvValue } from '@prisma/sdk';

import { run } from './generator';

import type { GeneratorOptions } from '@prisma/generator-helper';

export const stringToBoolean = (input: string, defaultValue = false) => {
  if (input === 'true') {
    return true;
  }
  if (input === 'false') {
    return false;
  }

  return defaultValue;
};

export const generate = (options: GeneratorOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const output = parseEnvValue(options.generator.output!);

  const {
    createDtoPrefix = 'Create',
    updateDtoPrefix = 'Update',
    dtoSuffix = 'Dto',
    enumSuffix = '',
    enumPrefix = '',
    entityPrefix = '',
    entitySuffix = '',
  } = options.generator.config;

  const includeRelations = stringToBoolean(
    options.generator.config.includeRelations,
  );
  const includeRelationFromFields = stringToBoolean(
    options.generator.config.includeRelationFromFields,
    true,
  );

  const results = run({
    dmmf: options.dmmf,
    includeRelations,
    includeRelationFromFields,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
    enumPrefix,
    enumSuffix,
    entityPrefix,
    entitySuffix,
  });

  return Promise.all(
    results.map(({ fileName, content }) =>
      fs.writeFile(path.join(output, fileName), content),
    ),
  );
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});

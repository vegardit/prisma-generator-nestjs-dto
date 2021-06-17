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
    entityPrefix = '',
    entitySuffix = '',
  } = options.generator.config;

  const keepRelations = stringToBoolean(options.generator.config.keepRelations);
  const keepRelationScalarFields = stringToBoolean(
    options.generator.config.keepRelationScalarFields,
    true,
  );

  const results = run({
    dmmf: options.dmmf,
    keepRelations,
    keepRelationScalarFields,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
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

import { generatorHandler } from '@prisma/generator-helper';
import { parseEnvValue } from '@prisma/sdk';

import { generateCode } from './generator/generate-code';

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

export const generate = async (options: GeneratorOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const output = parseEnvValue(options.generator.output!);

  const {
    dtoSuffix = 'Dto',
    enumSuffix = '',
    dtoPrefix = '',
    enumPrefix = '',
  } = options.generator.config;

  const includeRelationFields = stringToBoolean(
    options.generator.config.includeRelationFields,
  );
  const includeRelationFromFields = stringToBoolean(
    options.generator.config.includeRelationFromFields,
    true,
  );

  return generateCode(options.dmmf, {
    dtoSuffix,
    includeRelationFields,
    includeRelationFromFields,
    enumSuffix,
    dtoPrefix,
    enumPrefix,
    output,
  });
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});

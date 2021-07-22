import fs from 'fs/promises';
import * as path from 'path';
import makeDir from 'make-dir';
import { parseEnvValue } from '@prisma/sdk';
import { updateIndexCollection } from './generator/index-collection-helpers';

import { run } from './generator';

import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper';
import { IndexCollection } from './generator/types';

const indexCollections: IndexCollection[] = [];

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
    connectDtoPrefix = 'Connect',
    createDtoPrefix = 'Create',
    updateDtoPrefix = 'Update',
    dtoSuffix = 'Dto',
    entityPrefix = '',
    entitySuffix = '',
  } = options.generator.config;

  const exportRelationModifierClasses = stringToBoolean(
    options.generator.config.exportRelationModifierClasses,
    true,
  );

  const outputToNestJsResourceStructure = stringToBoolean(
    options.generator.config.outputToNestJsResourceStructure,
    // using `true` as default value would be a breaking change
    false,
  );

  const createIndex = stringToBoolean(
    options.generator.config.createIndex,
    // using `true` as default value would be a breaking change
    false,
  );

  const results = run({
    output,
    dmmf: options.dmmf,
    exportRelationModifierClasses,
    outputToNestJsResourceStructure,
    createIndex,
    connectDtoPrefix,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
    entityPrefix,
    entitySuffix,
  });

  const generatedResults = results.map(async ({ fileName, content }) => {
    const dirName = path.dirname(fileName);
    await makeDir(dirName);

    if (createIndex) updateIndexCollection({ fileName, indexCollections });

    return fs.writeFile(fileName, content);
  });

  if (!createIndex) return Promise.all(generatedResults);

  // Generate index files from Index Collection
  await Promise.all(generatedResults);
  const generatedIndexCollections = indexCollections.map((indexCollection) =>
    fs.writeFile(`${indexCollection.dir}/index.ts`, indexCollection.content),
  );

  return Promise.all(generatedIndexCollections);
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});

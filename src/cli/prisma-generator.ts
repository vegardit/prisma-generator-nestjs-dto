import { parseEnvValue } from "@prisma/sdk";

import { generateCode } from "../generator/generate-code";

import type { GeneratorOptions, DMMF } from "@prisma/generator-helper";

export const generate = async (options: GeneratorOptions) => {
  const output = parseEnvValue(options.generator.output!);

  return generateCode(options.dmmf, {
    ...options.generator.config,
    output,
  });
};

import { parseEnvValue } from "@prisma/sdk";

import { generateCode } from "../generator/generate-code";

import type { GeneratorOptions, DMMF } from "@prisma/generator-helper";

export const generate = async (options: GeneratorOptions) => {
  const output = parseEnvValue(options.generator.output!);

  // ? can the dependency on `prisma-client-js` be removed once difference between dmmfs is resolved?
  const clientJsGeneratorConfig = options.otherGenerators.find(
    (it) => parseEnvValue(it.provider) === "prisma-client-js"
  );

  if (!clientJsGeneratorConfig) {
    throw new Error(
      'peer generator "prisma-client-js" must be configured in prisma.schema'
    );
  }

  // reads `dmmf` from `prisma-client-js` generator output because apparently
  // the `GeneratorOptions.dmmf` differs from that generator output
  // TODO replace with `options.dmmf` when the spec match prisma client output
  // !what exactly is the difference between the two?
  const prismaClientPath = parseEnvValue(clientJsGeneratorConfig.output!);
  const { dmmf }: { dmmf: DMMF.Document } = await import(prismaClientPath);

  return generateCode(dmmf, {
    ...options.generator.config,
    output,
  });
};

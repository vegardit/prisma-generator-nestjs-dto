import { GeneratorOptions } from "@prisma/generator-helper";
import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { parseEnvValue } from "@prisma/sdk";
import { promises as asyncFs } from "fs";
import path from "path";

import removeDir from "../utils/removeDir";
import { toUnixPath } from "../generator/helpers";
import { GenerateCodeOptions } from "../generator/options";
import { generateCode } from "../generator/generate-code";

function parseStringBoolean(stringBoolean: string | undefined) {
  return stringBoolean ? stringBoolean === "true" : undefined;
}

export async function generate(options: GeneratorOptions) {
  const outputDir = parseEnvValue(options.generator.output!);
  await asyncFs.mkdir(outputDir, { recursive: true });
  await removeDir(outputDir, true);

  const prismaClientProvider = options.otherGenerators.find(
    (it) => parseEnvValue(it.provider) === "prisma-client-js"
  )!;
  const prismaClientPath = parseEnvValue(prismaClientProvider.output!);
  const prismaClientDmmf = require(prismaClientPath)
    .dmmf as PrismaDMMF.Document;

  const generatorConfig = options.generator.config;
  const config: GenerateCodeOptions = {
    outputDirPath: outputDir,
    relativePrismaOutputPath: toUnixPath(
      path.relative(outputDir, prismaClientPath)
    ),
    absolutePrismaOutputPath: prismaClientPath.includes("node_modules")
      ? "@prisma/client"
      : undefined,
  };

  // TODO: replace with `options.dmmf` when the spec match prisma client output
  await generateCode(prismaClientDmmf, config);
  return "";
}

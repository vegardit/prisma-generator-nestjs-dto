import { generatorHandler } from "@prisma/generator-helper";
import { generate } from "./prisma-generator";

generatorHandler({
  onManifest: () => ({
    defaultOutput: "../src/generated/nestjs-dto",
    prettyName: "NestJS DTO Generator",
    requiresGenerators: ["prisma-client-js"],
  }),
  onGenerate: generate,
});

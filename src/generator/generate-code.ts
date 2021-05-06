import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import * as path from "path";
import { CompilerOptions, ModuleKind, Project, ScriptTarget } from "ts-morph";
import { GenerateCodeOptions } from "./options";
import { createDtoTemplate } from "./templates/dto.template";
import prettier from "prettier";
import { createEnumTemplate } from "./templates/enum.template";

const baseCompilerOptions: CompilerOptions = {
  target: ScriptTarget.ES2019,
  module: ModuleKind.CommonJS,
  emitDecoratorMetadata: true,
  experimentalDecorators: true,
  esModuleInterop: true,
};

export const generateCode = async (
  dmmf: PrismaDMMF.Document,
  options: GenerateCodeOptions
) => {
  const project = new Project({
    compilerOptions: {
      ...baseCompilerOptions,
      ...{ declaration: true },
    },
  });

  // we process the services
  await createServicesFromModels(project, dmmf, options);

  await project.save();
};

async function createServicesFromModels(
  project: Project,
  dmmf: PrismaDMMF.Document,
  options: GenerateCodeOptions
) {
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;

  for (const enumModel of enums) {
    const outputFileName = `${enumModel.name.toLowerCase()}.enum`;
    const outputFile = `${outputFileName}.ts`;

    project.createSourceFile(
      path.join(options.outputDirPath, outputFile),
      prettier.format(createEnumTemplate({ enumModel }), {
        parser: "typescript",
      }),
      { overwrite: true }
    );
  }

  for (const model of models) {
    console.log(`Processing Model ${model.name}`);

    console.log(model.fields);

    const outputFileName = `${model.name.toLowerCase()}.dto`;
    const outputFile = `${outputFileName}.ts`;

    project.createSourceFile(
      path.join(options.outputDirPath, outputFile),
      prettier.format(createDtoTemplate({ model }), { parser: "typescript" }),
      { overwrite: true }
    );
  }
}

import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import * as path from "path";
import { CompilerOptions, ModuleKind, Project, ScriptTarget } from "ts-morph";
import { GenerateCodeOptions } from "./options";
import { createDtoTemplate } from "./templates/dto.template";
import prettier from "prettier";
import { createEnumTemplate } from "./templates/enum.template";
import Case from "case";

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

function getCaseFn(filenameCase: GenerateCodeOptions["filenameCase"]) {
  switch (filenameCase) {
    case "snake":
      return Case.snake;
    case "kebab":
      return Case.kebab;
    default:
      return Case.camel;
  }
}

async function createServicesFromModels(
  project: Project,
  dmmf: PrismaDMMF.Document,
  options: GenerateCodeOptions
) {
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;

  const caseFn = getCaseFn(options.filenameCase);

  const dtoSuffix = options.dtoSuffix || "Dto";
  const classPrefix = options.classPrefix || "";

  for (const enumModel of enums) {
    const outputFileName = `${caseFn(enumModel.name)}.enum`;
    const outputFile = `${outputFileName}.ts`;

    project.createSourceFile(
      path.join(options.outputDirPath, outputFile),
      prettier.format(createEnumTemplate({ enumModel, classPrefix }), {
        parser: "typescript",
      }),
      { overwrite: true }
    );
  }

  for (const model of models) {
    console.log(`Processing Model ${model.name}`);

    const outputFileName = `${caseFn(model.name)}.dto`;
    const outputFile = `${outputFileName}.ts`;

    project.createSourceFile(
      path.join(options.outputDirPath, outputFile),
      prettier.format(
        createDtoTemplate({ model, dtoSuffix, classPrefix, caseFn }),
        {
          parser: "typescript",
        }
      ),
      { overwrite: true }
    );
  }
}

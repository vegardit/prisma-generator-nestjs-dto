import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { promises as fs } from "fs";
import * as path from "path";
import { CompilerOptions, ModuleKind, Project, ScriptTarget } from "ts-morph";
import { GenerateCodeOptions } from "./options";
import { createDtoTemplate } from "./templates/dto.template";
import prettier from "prettier";

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
  const dtoPath = path.join(options.outputDirPath, "dto");

  console.log(dtoPath);
  console.log(dmmf.datamodel.models);

  // await fs.mkdir(path.join(servicePath), { recursive: true });

  // const barrelFilePath = path.join(servicePath, "index.ts");
  // const serviceBarrelFile = project.createSourceFile(
  //   barrelFilePath,
  //   undefined,
  //   { overwrite: true }
  // );

  const models = dmmf.datamodel.models;
  // const serviceStubContent = stubContent;
  // const serviceNames: string[] = [];
  for (const model of models) {
    console.log(`Processing Model ${model.name}`);
    console.log(model);

    console.log(model.fields);
    // let serviceContent = serviceStubContent;

    // // now we replace some placeholders
    // serviceContent = serviceContent.replace(/__Class__/g, model.name);
    // serviceContent = serviceContent.replace(
    //   /__class__/g,
    //   model.name.toLowerCase()
    // );

    // write to output
    const outputFileName = `${model.name.toLowerCase()}.dto`;
    const outputFile = `${outputFileName}.ts`;

    project.createSourceFile(
      path.join(options.outputDirPath, outputFile),
      prettier.format(createDtoTemplate({ model }), { parser: "typescript" }),
      { overwrite: true }
    );

    // serviceNames.push(outputFileName);
  }

  // generateServicesBarrelFile(serviceBarrelFile, serviceNames);
}

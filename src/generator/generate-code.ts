import * as path from "path";
import fs from "fs/promises";
import prettier from "prettier";
import Case from "case";
import { createDtoTemplate } from "./templates/dto.template";
import { createEnumTemplate } from "./templates/enum.template";

import type { DMMF } from "@prisma/generator-helper";
import type { GenerateCodeOptions } from "./options";

export const generateCode = (
  dmmf: DMMF.Document,
  options: GenerateCodeOptions
) => {
  const results = createServicesFromModels(dmmf, options);

  return Promise.all(
    results.map(({ fileName, content }) => fs.writeFile(fileName, content))
  );
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

function createServicesFromModels(
  dmmf: DMMF.Document,
  options: GenerateCodeOptions
) {
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;
  const { output, dtoSuffix = "Dto", classPrefix = "" } = options;

  const caseFn = getCaseFn(options.filenameCase);

  const enumsFiles = enums.map((enumModel) => {
    const fileName = path.join(output, `${caseFn(enumModel.name)}.enum.ts`);
    const content = prettier.format(
      createEnumTemplate({ enumModel, classPrefix }),
      {
        parser: "typescript",
      }
    );

    return { fileName, content };
  });

  const modelFiles = models.map((model) => {
    console.log(`Processing Model ${model.name}`);
    // model.fields.forEach(field => console.log(model.name, field))
    const fileName = path.join(output, `${caseFn(model.name)}.dto.ts`);

    const content = prettier.format(
      createDtoTemplate({ model, dtoSuffix, classPrefix, caseFn }),
      {
        parser: "typescript",
      }
    );
    return { fileName, content };
  });

  return [...modelFiles, ...enumsFiles];
}

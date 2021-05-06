import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { mapScalarToTSType } from "../helpers";

interface CreateDtoTemplateOptions {
  model: PrismaDMMF.Model;
}

export function createDtoTemplate({ model }: CreateDtoTemplateOptions) {
  let template = "";

  const imports = model.fields
    .map((field) => {
      if (field.type !== "scalar") {
        return field.type;
      }

      return "";
    })
    .filter(Boolean);

  for (const importField of imports) {
    template += `import { ${importField} } from './${importField.toLocaleLowerCase()}.dto.ts'`;
  }

  template += `export class ${model.name}Dto {`;

  for (const field of model.fields) {
    template += `${field.name}${field.isRequired ? "" : "?"}: ${
      field.kind === "scalar"
        ? mapScalarToTSType(field.type, false)
        : field.type
    }${field.isList ? "[]" : ""};`;
  }

  template += "}";

  return template;
}

import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { mapScalarToTSType } from "../helpers";

interface CreateDtoTemplateOptions {
  model: PrismaDMMF.Model;
}

export function createDtoTemplate({ model }: CreateDtoTemplateOptions) {
  let template = "";

  const imports = model.fields
    .map((field) => {
      if (field.kind !== "scalar") {
        return field.type;
      }

      return "";
    })
    .filter(Boolean);

  for (const importField of new Set(imports)) {
    template += `import { ${importField}Dto } from './${importField.toLocaleLowerCase()}.dto';`;
  }

  template += "\n\n";

  template += `export class ${model.name}Dto {`;

  for (const field of model.fields) {
    template += `${field.name}${field.isRequired ? "" : "?"}: ${
      field.kind === "scalar"
        ? mapScalarToTSType(field.type, false)
        : `${field.type}Dto`
    }${field.isList ? "[]" : ""};`;
  }

  template += "}";

  return template;
}

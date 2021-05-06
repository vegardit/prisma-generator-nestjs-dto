import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { mapScalarToTSType } from "../helpers";

interface CreateDtoTemplateOptions {
  model: PrismaDMMF.Model;
}

export function createDtoTemplate({ model }: CreateDtoTemplateOptions) {
  let template = "";

  const dtos = model.fields
    .map((field) => (field.kind === "object" ? field.type : ""))
    .filter(Boolean);

  const enums = model.fields
    .map((field) => (field.kind === "enum" ? field.type : ""))
    .filter(Boolean);

  for (const importField of new Set(dtos)) {
    template += `import { ${importField}Dto } from './${importField.toLocaleLowerCase()}.dto';`;
  }

  for (const enumField of new Set(enums)) {
    template += `import { ${enumField} } from './${enumField.toLocaleLowerCase()}.enum';`;
  }

  template += "\n\n";

  template += `export class ${model.name}Dto {`;

  for (const field of model.fields) {
    template += `${field.name}${field.isRequired ? "" : "?"}: ${
      field.kind === "scalar"
        ? mapScalarToTSType(field.type, false)
        : field.kind === "enum"
        ? field.type
        : `${field.type}Dto`
    }${field.isList ? "[]" : ""};`;
  }

  template += "}";

  return template;
}

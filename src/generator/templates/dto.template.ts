import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { mapScalarToTSType } from "../helpers";

interface CreateDtoTemplateOptions {
  model: PrismaDMMF.Model;
  dtoSuffix: string;
  classPrefix: string;
  caseFn: (input: string) => string;
}

export function createDtoTemplate({
  model,
  dtoSuffix,
  classPrefix,
  caseFn,
}: CreateDtoTemplateOptions) {
  let template = "";

  const dtos = model.fields
    .map((field) => (field.kind === "object" ? field.type : ""))
    .filter(Boolean);

  const enums = model.fields
    .map((field) => (field.kind === "enum" ? field.type : ""))
    .filter(Boolean);

  for (const importField of new Set(dtos)) {
    template += `import { ${classPrefix}${importField}${dtoSuffix} } from './${caseFn(
      importField
    )}.dto';`;
  }

  for (const enumField of new Set(enums)) {
    template += `import { ${classPrefix}${enumField} } from './${caseFn(
      enumField
    )}.enum';`;
  }

  template += "\n\n";

  template += `export class ${classPrefix}${model.name}${dtoSuffix} {`;

  for (const field of model.fields) {
    template += `${field.name}${field.isRequired ? "" : "?"}: ${
      field.kind === "scalar"
        ? mapScalarToTSType(field.type, false)
        : field.kind === "enum"
        ? `${classPrefix}${field.type}`
        : `${classPrefix}${field.type}${dtoSuffix}`
    }${field.isList ? "[]" : ""};`;
  }

  template += "}";

  return template;
}

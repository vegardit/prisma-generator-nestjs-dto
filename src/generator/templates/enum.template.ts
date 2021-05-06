import { DMMF as PrismaDMMF } from "@prisma/client/runtime";

interface CreateEnumTemplateOptions {
  enumModel: PrismaDMMF.DatamodelEnum;
}

export function createEnumTemplate({ enumModel }: CreateEnumTemplateOptions) {
  let template = "";

  template += `export enum ${enumModel.name} {\n`;

  for (const enumValue of enumModel.values) {
    template += `${enumValue.name}${
      enumValue.dbName ? `= '${enumValue.dbName}'` : ""
    },\n`;
  }
  template += "}";

  return template;
}

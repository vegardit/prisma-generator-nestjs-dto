import { DMMF as PrismaDMMF } from "@prisma/client/runtime";

interface CreateEnumTemplateOptions {
  enumModel: PrismaDMMF.DatamodelEnum;
  classPrefix: string;
}

export function createEnumTemplate({
  enumModel,
  classPrefix,
}: CreateEnumTemplateOptions) {
  let template = "";

  template += `export enum ${classPrefix}${enumModel.name} {\n`;

  for (const enumValue of enumModel.values) {
    template += `${enumValue.name}${
      enumValue.dbName ? `= '${enumValue.dbName}'` : ""
    },\n`;
  }
  template += "}";

  return template;
}

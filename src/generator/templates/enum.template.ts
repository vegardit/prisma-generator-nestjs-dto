import type { DMMF } from "@prisma/generator-helper";

interface CreateEnumTemplateOptions {
  enumModel: DMMF.DatamodelEnum;
  classPrefix: string;
  enumSuffix?: string;
}

export function createEnumTemplate({
  enumModel,
  classPrefix,
  enumSuffix = "",
}: CreateEnumTemplateOptions) {
  const template = `
  export enum ${classPrefix}${enumModel.name}${enumSuffix} {
    ${enumModel.values.map(
      (value) => `${value.name}${value.dbName ? `= '${value.dbName}'` : ""},`
    )}
  };
  `;

  return template;
}

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';

interface GenerateEnumParam {
  enumModel: DMMF.DatamodelEnum;
  templateHelpers: TemplateHelpers;
}

export function generateEnum({
  enumModel,
  templateHelpers: t,
}: GenerateEnumParam) {
  const template = `
export enum ${t.enumName(enumModel.name)} {
  ${enumModel.values.map(
    (value) => `${value.name}${t.if(value.dbName, `= '${value.dbName}'`)}`,
  )}
};
`;

  return template;
}

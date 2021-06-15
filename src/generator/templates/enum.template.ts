import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';

interface CreateEnumTemplateOptions {
  enumModel: DMMF.DatamodelEnum;
  templateHelpers: TemplateHelpers;
}

export function createEnumTemplate({
  enumModel,
  templateHelpers: t,
}: CreateEnumTemplateOptions) {
  const template = `
export enum ${t.enumName(enumModel.name)} {
  ${enumModel.values.map(
    (value) => `${value.name}${t.if(value.dbName, `= '${value.dbName}'`)}`,
  )}
};
`;

  return template;
}

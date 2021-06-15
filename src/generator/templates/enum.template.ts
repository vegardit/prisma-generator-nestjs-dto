import type { DMMF } from '@prisma/generator-helper';
import { makeHelpers } from '../template-helpers';

interface CreateEnumTemplateOptions {
  enumModel: DMMF.DatamodelEnum;
  dtoPrefix: string;
  enumPrefix: string;
  dtoSuffix: string;
  enumSuffix: string;
}

export function createEnumTemplate({
  enumModel,
  ...preAndSuffixes
}: CreateEnumTemplateOptions) {
  const th = makeHelpers({
    ...preAndSuffixes,
  });

  const template = `
export enum ${th.enumName(enumModel.name)} {
  ${enumModel.values.map(
    (value) => `${value.name}${th.if(value.dbName, `= '${value.dbName}'`)}`,
  )}
};
`;

  return template;
}

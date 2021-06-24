import { isId, isUnique } from './field-classifiers';
import { mapDMMFToParsedField } from './helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { DtoParams } from './types';

interface ComputeConnectDtoParamsParam {
  model: DMMF.Model;
}
export const computeConnectDtoParams = ({
  model,
}: ComputeConnectDtoParamsParam): DtoParams => {
  const idFields = model.fields.filter((field) => isId(field));
  const uniqueFields = model.fields.filter((field) => isUnique(field));

  // TODO if fields.length > 1, set overrides = { isRequired: false }
  // TODO consider adding documentation block to model that one of the properties must be provided
  const fields = [...idFields, ...uniqueFields].map((field) =>
    mapDMMFToParsedField(field),
  );

  return { model, fields };
};

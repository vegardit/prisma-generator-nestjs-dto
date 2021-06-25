import { TemplateHelpers } from '../template-helpers';
import { computeConnectDtoParams } from './compute-connect-dto-params';
import { computeCreateDtoParams } from './compute-create-dto-params';
import { computeUpdateDtoParams } from './compute-update-dto-params';
import { computeEntityParams } from './compute-entity-params';

import type { DMMF } from '@prisma/generator-helper';
import type { ModelParams } from '../types';

interface ComputeModelParamsParam {
  model: DMMF.Model;
  allModels: DMMF.Model[];
  templateHelpers: TemplateHelpers;
}
export const computeModelParams = ({
  model,
  allModels,
  templateHelpers,
}: ComputeModelParamsParam): ModelParams => ({
  // TODO find out if model needs `ConnectDTO`
  connect: computeConnectDtoParams({ model }),
  // ? should this be `allModels: models` instead
  create: computeCreateDtoParams({
    model,
    allModels,
    templateHelpers,
  }),

  update: computeUpdateDtoParams({
    model,
    allModels,
    templateHelpers,
  }),
  entity: computeEntityParams({ model, templateHelpers }),
});

import { DTO_IGNORE_MODEL } from './annotations';
import { isAnnotatedWith } from './field-classifiers';
import { TemplateHelpers } from './template-helpers';

import type { DMMF } from '@prisma/generator-helper';

interface ParseModelsParam {
  models: DMMF.Model[];
  templateHelpers: TemplateHelpers;
}
export const parseModels = ({ models, templateHelpers }: ParseModelsParam) => {
  const filteredModels = models.filter((model) =>
    isAnnotatedWith(model, DTO_IGNORE_MODEL),
  );

  filteredModels.forEach((model) => {
    // TODO find out if model needs `ConnectDTO`
    // ? should this be `allModels: models` instead
    computeCreateDtoParams({
      model,
      allModels: filteredModels,
      templateHelpers,
    });
    computeConnectDtoParams(model);
    computeUpdateDtoParams(model);
    computeEntityParams(model);
  });
};

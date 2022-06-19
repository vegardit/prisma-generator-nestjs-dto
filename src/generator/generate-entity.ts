import type { TemplateHelpers } from './template-helpers';
import type { EntityParams } from './types';

interface GenerateEntityParam extends EntityParams {
  enumAsSchema: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateEntity = ({
  model,
  fields,
  imports,
  apiExtraModels,
  enumAsSchema,
  templateHelpers: t,
}: GenerateEntityParam) => `
${t.importStatements(imports)}

${t.if(apiExtraModels.length, t.apiExtraModels(apiExtraModels))}
export class ${t.entityName(model.name)} {
  ${t.fieldsToEntityProps(fields, enumAsSchema)}
}
`;

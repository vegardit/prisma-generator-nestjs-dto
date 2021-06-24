import type { TemplateHelpers } from './template-helpers';
import type { UpdateDtoParams } from './types';

interface GenerateUpdateDtoParam extends UpdateDtoParams {
  exportRelationModifierClasses: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateUpdateDto = ({
  model,
  fields,
  imports,
  extraClasses,
  apiExtraModels,
  exportRelationModifierClasses,
  templateHelpers: t,
}: GenerateUpdateDtoParam) => `
${t.importStatements(imports)}

${t.each(
  extraClasses,
  exportRelationModifierClasses ? (content) => `export ${content}` : t.echo,
  '\n',
)}

${t.if(apiExtraModels.length, t.apiExtraModels(apiExtraModels))}
export class ${t.updateDtoName(model.name)} {
  ${t.fieldsToDtoProps(fields, true)}
}
`;

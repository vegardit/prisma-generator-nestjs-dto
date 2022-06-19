import type { TemplateHelpers } from './template-helpers';
import type { CreateDtoParams } from './types';

interface GenerateCreateDtoParam extends CreateDtoParams {
  exportRelationModifierClasses: boolean;
  enumAsSchema: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateCreateDto = ({
  model,
  fields,
  imports,
  extraClasses,
  apiExtraModels,
  exportRelationModifierClasses,
  enumAsSchema,
  templateHelpers: t,
}: GenerateCreateDtoParam) => `
${t.importStatements(imports)}

${t.each(
  extraClasses,
  exportRelationModifierClasses ? (content) => `export ${content}` : t.echo,
  '\n',
)}

${t.if(apiExtraModels.length, t.apiExtraModels(apiExtraModels))}
export class ${t.createDtoName(model.name)} {
  ${t.fieldsToDtoProps(fields, enumAsSchema, true)}
}
`;

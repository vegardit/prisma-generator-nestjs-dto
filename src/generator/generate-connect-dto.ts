import type { TemplateHelpers } from './template-helpers';
import type { ConnectDtoParams } from './types';

interface GenerateConnectDtoParam extends ConnectDtoParams {
  enumAsSchema: boolean;
  templateHelpers: TemplateHelpers;
}
export const generateConnectDto = ({
  model,
  fields,
  enumAsSchema,
  templateHelpers: t,
}: GenerateConnectDtoParam) => {
  const template = `
  export class ${t.connectDtoName(model.name)} {
    ${t.fieldsToDtoProps(fields, enumAsSchema, true)}
  }
  `;

  return template;
};

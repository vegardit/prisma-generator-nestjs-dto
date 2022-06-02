import { DTO_VARIABLES } from './annotations';
import type { DMMF } from '@prisma/generator-helper';

export const isAnnotatedWithVariable = (
  instance: DMMF.Field | DMMF.Model,
  variableName: keyof typeof DTO_VARIABLES,
): string | undefined => {
  const { documentation = '' } = instance;
  const match = documentation.match(DTO_VARIABLES[variableName]);
  return match?.groups?.[variableName];
};

export const getOutputFolder = (model: DMMF.Model): string | undefined =>
  isAnnotatedWithVariable(model, 'folder');

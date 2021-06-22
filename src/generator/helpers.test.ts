import { mapDMMFToParsedField } from './helpers';
import type { DMMF } from '@prisma/generator-helper';
import { ParsedField } from './types';

test('mapDMMFToParsedField', () => {
  const field: DMMF.Field = {
    name: 'a',
    kind: 'scalar',
    type: 'string',
    isRequired: false,
    isUnique: false,
    isUpdatedAt: false,
    isList: false,
    isId: false,
    isReadOnly: false,
    isGenerated: false,
    hasDefaultValue: false,
  };

  const overrides = { name: 'b' };

  const parsedField = mapDMMFToParsedField(field, overrides);
  expect(parsedField.name).toBe(overrides.name);
  Object.keys(field)
    .filter((key) => key !== 'name')
    .forEach((key) => {
      expect(parsedField[key as keyof ParsedField]).toBe(field[key]);
    });
});

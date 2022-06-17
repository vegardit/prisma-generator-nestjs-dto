import * as validator from 'class-validator';
import { ImportStatementParams } from './types';
import { getAnnotations } from './field-classifiers';
import { DMMF } from '@prisma/generator-helper';

export enum DtoType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  ENTITY = 'ENTITY',
}

export const DTO_TYPES_STRING = Object.keys(DtoType).join('|');

export const DTO_TYPES_REGEX = new RegExp(
  `\\[(?:(${DTO_TYPES_STRING})\\s?,?\\s?)+]$`,
  'i',
);

const VALIDATOR_DECORATOR_REGEX = /^(?:Is|Not|Array|Min|Max)[A-Za-z0-9]*$/;

export const VALIDATOR_DECORATORS = new Set(
  Object.keys(validator)
    .filter((key) => VALIDATOR_DECORATOR_REGEX.test(key))
    .concat('Equals', 'Contains', 'Length', 'Matches', 'Allow'),
);

const splitDecorator = (decorator: string) => {
  const index = decorator.search(DTO_TYPES_REGEX);
  return index === -1
    ? [decorator, '']
    : [decorator.substring(0, index), decorator.substring(index)];
};

export const getValidatorAnnotations = (
  field: DMMF.Field | DMMF.Model,
  type: DtoType,
): [string[], ImportStatementParams] => {
  const decorators = [];
  const imports = [];
  for (const [decorator, imp] of getAnnotations(field)) {
    if (!VALIDATOR_DECORATORS.has(imp)) continue;
    const [deco, types] = splitDecorator(decorator);
    if (types === '' || types.toUpperCase().includes(type)) {
      decorators.push(deco);
      imports.push(imp);
    }
  }
  return [
    decorators,
    {
      from: 'class-validator',
      destruct: imports,
    },
  ];
};

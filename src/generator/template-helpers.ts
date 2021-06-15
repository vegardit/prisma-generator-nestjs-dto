import type { DMMF } from '@prisma/generator-helper';

const PrismaScalarToTypeScript: Record<string, string> = {
  String: 'string',
  Boolean: 'boolean',
  Int: 'number',
  // [Working with BigInt](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-bigint)
  BigInt: 'bigint',
  Float: 'number',
  // [Working with Decimal](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-decimal)
  Decimal: 'Prisma.Decimal',
  DateTime: 'Date',
  // [working with JSON fields](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)
  Json: 'Prisma.JsonValue',
  // [Working with Bytes](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-bytes)
  Bytes: 'Buffer',
};

const knownPrismaScalarTypes = Object.keys(PrismaScalarToTypeScript);

export const scalarToTS = (scalar: string, useInputTypes = false): string => {
  if (!knownPrismaScalarTypes.includes(scalar)) {
    throw new Error(`Unrecognized scalar type: ${scalar}`);
  }

  // [Working with JSON fields](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)
  // supports different types for input / output. `Prisma.InputJsonValue` extends `Prisma.JsonValue` with `undefined`
  if (useInputTypes && scalar === 'Json') {
    return 'Prisma.InputJsonValue';
  }

  return PrismaScalarToTypeScript[scalar];
};

export const echo = (input: string) => input;

export const when = (condition: any, thenTemplate: string, elseTemplate = '') =>
  condition ? thenTemplate : elseTemplate;

export const unless = (
  condition: any,
  thenTemplate: string,
  elseTemplate = '',
) => (!condition ? thenTemplate : elseTemplate);

export const each = <T = any>(
  arr: Array<T>,
  fn: (item: T) => string,
  joinWith = '',
) => arr.map(fn).join(joinWith);

export const importStatement = (names: string[], from: string) =>
  `import { ${names} } from '${from}';\n`;

interface MakeHelpersParam {
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  enumPrefix: string;
  enumSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
  transformCase?: (item: string) => string;
}
export const makeHelpers = ({
  createDtoPrefix,
  updateDtoPrefix,
  dtoSuffix,
  enumPrefix,
  enumSuffix,
  entityPrefix,
  entitySuffix,
  transformCase = echo,
}: MakeHelpersParam) => {
  const entityName = (name: string) => `${entityPrefix}${name}${entitySuffix}`;
  const createDtoName = (name: string) =>
    `${createDtoPrefix}${name}${dtoSuffix}`;
  const updateDtoName = (name: string) =>
    `${updateDtoPrefix}${name}${dtoSuffix}`;
  const enumName = (name: string) => `${enumPrefix}${name}${enumSuffix}`;

  const importEnum = (name: string) =>
    importStatement([name].map(enumName), `./${transformCase(name)}.enum`);
  const importEnums = (names: string[]) =>
    each(names, (name) => importEnum(name));

  const importEntity = (name: string) =>
    importStatement([name].map(entityName), `./${transformCase(name)}.entity`);
  const importEntities = (names: string[]) =>
    each(names, (name) => importEntity(name));

  const fieldType = (field: DMMF.Field, toInputType = false) =>
    `${
      field.kind === 'scalar'
        ? scalarToTS(field.type, toInputType)
        : field.kind === 'enum'
        ? enumName(field.type)
        : entityName(field.type)
    }${when(field.isList, '[]')}`;

  const fieldToDtoProp = (
    field: DMMF.Field,
    useInputTypes = false,
    forceOptional = false,
  ) =>
    `${field.name}${unless(
      field.isRequired && !forceOptional,
      '?',
    )}: ${fieldType(field, useInputTypes)};`;

  const fieldsToDtoProps = (
    fields: DMMF.Field[],
    useInputTypes = false,
    forceOptional = false,
  ) =>
    `${each(
      fields,
      (field) => fieldToDtoProp(field, useInputTypes, forceOptional),
      '\n',
    )}`;

  const fieldToEntityProp = (field: DMMF.Field) =>
    `${field.name}: ${fieldType(field)} ${unless(
      field.isRequired,
      ' | null',
    )};`;

  const fieldsToEntityProps = (fields: DMMF.Field[]) =>
    `${each(fields, (field) => fieldToEntityProp(field), '\n')}`;

  const apiExtraModels = (modelNames: string[]) =>
    `@ApiExtraModels(${modelNames.map(entityName)})`;

  return {
    apiExtraModels,
    entityName,
    createDtoName,
    updateDtoName,
    each,
    echo,
    enumName,
    fieldsToDtoProps,
    fieldToDtoProp,
    fieldToEntityProp,
    fieldsToEntityProps,
    fieldType,
    for: each,
    if: when,
    importEntities,
    importEnum,
    importEnums,
    importStatement,
    unless,
    when,
  };
};

export type TemplateHelpers = ReturnType<typeof makeHelpers>;

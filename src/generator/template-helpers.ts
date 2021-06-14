import type { DMMF } from "@prisma/generator-helper";

const PrismaScalarToTypeScript = {
  String: "string",
  Boolean: "boolean",
  Int: "number",
  // [Working with BigInt](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-bigint)
  BigInt: "bigint",
  Float: "number",
  // [Working with Decimal](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-decimal)
  Decimal: "Prisma.Decimal",
  DateTime: "Date",
  // [working with JSON fields](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)
  Json: "Prisma.JsonValue",
  // [Working with Bytes](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields#working-with-bytes)
  Bytes: "Buffer",
};

const knownPrismaScalarTypes = Object.keys(PrismaScalarToTypeScript);
export const scalarToTS = (scalar: string, toInputType: boolean = false) => {
  if (!knownPrismaScalarTypes.includes(scalar)) {
    throw new Error(`Unrecognized scalar type: ${scalar}`);
  }

  // [Working with JSON fields](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)
  // supports different types for input / output. `Prisma.InputJsonValue` extends `Prisma.JsonValue` with `undefined`
  if ( toInputType && scalar === 'Json') {
    return "Prisma.InputJsonValue";
  }

  return PrismaScalarToTypeScript[scalar];
};

export const echo = (input: string) => input;

export const when = (
  condition,
  thenTemplate: string,
  elseTemplate: string = ""
) => (condition ? thenTemplate : elseTemplate);

export const unless = (
  condition,
  thenTemplate: string,
  elseTemplate: string = ""
) => (!condition ? thenTemplate : elseTemplate);

export const each = <T = any>(
  arr: Array<T>,
  fn: (item: T) => string,
  joinWith = ""
) => arr.map(fn).join(joinWith);

export const importStatement = (names: string[], from: string) =>
  `import { ${names} } from '${from}';`;

interface MakeHelpersParam {
  dtoPrefix?: string;
  enumPrefix?: string;
  dtoSuffix?: string;
  enumSuffix?: string;
  transformCase: (item: string) => string;
}
export const makeHelpers = ({
  dtoPrefix = "",
  enumPrefix = "",
  dtoSuffix = "",
  enumSuffix = "",
  transformCase = echo,
}: MakeHelpersParam) => {
  const importEnum = (name: string) =>
    importStatement(
      [name].map((value) => `${enumPrefix}${value}${enumSuffix}`),
      `./${transformCase(name)}.enum`
    );
  const importEnums = (names: string[]) =>
    each(names, (name) => importEnum(name), ';\n');

  const importDto = (name: string) =>
    importStatement(
      [name].map((value) => `${dtoPrefix}${value}${dtoSuffix}`),
      `./${transformCase(name)}.dto`
    );
  const importDtos = (names: string[]) =>
    each(names, (name) => importDto(name), ';\n');

  const fieldType = (field: DMMF.Field, toInputType: boolean = false) =>
    `${
      field.kind === "scalar"
        ? scalarToTS(field.type, toInputType)
        : field.kind === "enum"
        ? `${enumPrefix}${field.type}`
        : `${dtoPrefix}${field.type}${dtoSuffix}`
    }${when(field.isList, "[]")}`;

  const fieldToClassProp = (
    field: DMMF.Field,
    useInputTypes: boolean = false
  ) =>
    `${field.name}${unless(field.isRequired, "?")}: ${fieldType(
      field,
      useInputTypes
    )};`;

  const fieldsToClassProps = (
    fields: DMMF.Field[],
    useInputTypes: boolean = false
  ) =>
    `${each(fields, (field) => fieldToClassProp(field, useInputTypes), "\n")}`;

  return {
    echo,
    when,
    unless,
    each,
    importStatement,
    importEnum,
    importEnums,
    importDto,
    importDtos,
    fieldType,
    fieldToClassProp,
    fieldsToClassProps,
  };
};

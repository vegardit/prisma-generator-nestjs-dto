enum PrismaScalars {
  String = "String",
  Boolean = "Boolean",
  Int = "Int",
  Float = "Float",
  DateTime = "DateTime",
  Json = "Json",
  BigInt = "BigInt",
  Decimal = "Decimal",
  Bytes = "Bytes",
}

export function noop() {}

export function mapScalarToTSType(scalar: string, isInputType: boolean) {
  switch (scalar) {
    case PrismaScalars.String: {
      return "string";
    }
    case PrismaScalars.Boolean: {
      return "boolean";
    }
    case PrismaScalars.Int:
    case PrismaScalars.Float: {
      return "number";
    }
    case PrismaScalars.DateTime: {
      return "Date";
    }
    case PrismaScalars.Json:
      return isInputType ? "Prisma.InputJsonValue" : "Prisma.JsonValue";
    case PrismaScalars.BigInt: {
      return "bigint";
    }
    case PrismaScalars.Decimal: {
      return "Prisma.Decimal";
    }
    case PrismaScalars.Bytes: {
      return "Buffer";
    }
    default:
      throw new Error(`Unrecognized scalar type: ${scalar}`);
  }
}

export function camelCase(str: string) {
  return str[0].toLowerCase() + str.slice(1);
}

export function pascalCase(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

export function toUnixPath(maybeWindowsPath: string) {
  return maybeWindowsPath.split("\\").join("/");
}

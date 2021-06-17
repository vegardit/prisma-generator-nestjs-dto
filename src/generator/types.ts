import { DMMF } from '@prisma/generator-helper';

export interface ParsedField {
  kind: DMMF.FieldKind;
  name: string;
  type: string;
  documentation?: string;
  isRequired: boolean;
  isList: boolean;
  /**
   * used when rendering Entity templates - fields that are optional in Prisma Schema
   * are returned as `null` values (if not filled) when fetched from PrismaClient.
   * **must not be `true` when `isRequired` is `true`**
   */
  isNullable?: boolean;
}

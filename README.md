# Prisma Generator NestJS DTO

[![Build Status](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto.svg?branch=master)](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto)
[![Release](https://badge.fury.io/js/%40vegardit%2Fprisma-generator-nestjs-dto.svg)](https://www.npmjs.com/package/@vegardit/prisma-generator-nestjs-dto)
[![License](https://img.shields.io/github/license/vegardit/prisma-generator-nestjs-dto.svg?label=license)](#license)

1. [What is it?](#what-is-it)
1. [Usage](#usage)
1. [Annotations](#annotations)
1. [Example](#example)
1. [Principles](#principles)
1. [License](#license)

## <a name="what-is-it"></a>What is it?

Generates `CreateDTO`, `UpdateDTO`, and `Entity` classes for models in your Prisma Schema. This is useful if you want to leverage [OpenAPI](https://docs.nestjs.com/openapi/introduction) in your [NestJS](https://nestjs.com/) application. NestJS Swagger required input parameters in [controllers to be described through classes](https://docs.nestjs.com/openapi/types-and-parameters) because it leverages TypeScript's emitted metadata and `Reflection` to generate models/components for the OpenAPI spec. It does the same for response models/components on your controller methods.

These classes can also be used with the built-in [ValidationPipe](https://docs.nestjs.com/techniques/validation#using-the-built-in-validationpipe) and [Serialization](https://docs.nestjs.com/techniques/serialization).

## <a name="usage"></a>Usage?

```sh
npm install --save-dev @vegardit/prisma-generator-nestjs-dto
```

```prisma
generator nestjsDto {
  provider        = "prisma-generator-nestjs-dto"
  output          = "../src/generated/nestjs-dto"
  exportRelationModifierClasses = "true"
  createDtoPrefix = "Create"
  updateDtoPrefix = "Update"
  dtoSuffix       = "Dto"
  entityPrefix    = ""
  entitySuffix    = ""
}
```

### Options

All options are optional.

- [`output`]: (default: `"../src/generated/nestjs-dto"`) - output path relative to your `schema.prisma` file
- [`exportRelationModifierClasses`]: (default: `"true"`) - Should extra classes generated for relationship field operations on DTOs be exported?
- [`createDtoPrefix`]: (default: `"Create"`) - phrase to prefix every `CreateDTO` class with
- [`updateDtoPrefix`]: (default: `"Update"`) - phrase to prefix every `UpdateDTO` class with
- [`dtoSuffix`]: (default: `"Dto"`) - phrase to suffix every `CreateDTO` and `UpdateDTO` class with
- [`entityPrefix`]: (default: `""`) - phrase to prefix every `Entity` class with
- [`entitySuffix`]: (default: `""`) - phrase to suffix every `Entity` class with

## <a name="annotations"></a>Annotations

Annotations provide additional information to help this generator understand your intentions. They are applied as [tripple slash comments](https://www.prisma.io/docs/concepts/components/prisma-schema#comments) to a field node in your Prisma Schema. You can apply multiple annotations to the same field.

```prisma
model Post {
  /// @DtoCreateOptional
  /// @DtoUpdateHidden
  createdAt   DateTime @default(now())
}
```

- @DtoReadOnly - omits field in `CreateDTO` and `UpdateDTO`
- @DtoEntityHidden - omits field in `Entity`
- @DtoCreateOptional - adds field **optionally** to `CreateDTO` - useful for fields that would otherwise be omitted (e.g. `@id`, `@updatedAt`)
- @DtoUpdateHidden - omits field in `UpdateDTO`
- @DtoUpdateOptional- adds field **optionally** to `UpdateDTO` - useful for fields that would otherwise be omitted (e.g. `@id`, `@updatedAt`)
- @DtoRelationRequired - marks relation **required** in `Entity` although it's optional in PrismaSchema - useful when you don't want (SQL) `ON DELETE CASCADE` behavior - but your logical data schema sees this relation as required

## <a name="example"></a>Example

<details>
  <summary>Prisma Schema</summary>
  
  ```prisma
  model Response {
    id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    /// @DtoCreateOptional
    /// @DtoUpdateHidden
    createdAt   DateTime @default(now())
    /// @DtoRelationRequired
    createdBy   User?    @relation("CreatedResponses", fields: [createdById], references: [id])
    createdById String?
    /// @DtoUpdateOptional
    updatedAt   DateTime @updatedAt
    /// @DtoRelationRequired
    updatedBy   User?    @relation("UpdatedResponses", fields: [updatedById], references: [id])
    updatedById String?

    question   Question @relation(fields: [questionId], references: [id])
    questionId String

    parentResponseId String?    @db.Uuid
    parentResponse   Response?  @relation("NestedResponses", fields: [parentResponseId], references: [id])
    responses        Response[] @relation("NestedResponses")

    title   String
    content String @db.Text
  }
  ```

</details>

<details>
  <summary>Generated results</summary>

  ```ts
  // src/generated/nestjs-dto/create-response.dto.ts
  export class CreateResponseDto {
    createdAt?: Date;
    title: string;
    content: string;
  }
  ```

  ```ts
  // src/generated/nestjs-dto/update-response.dto.ts
  export class UpdateResponseDto {
    updatedAt?: Date;
    title?: string;
    content?: string;
  }
  ```

  ```ts
  // src/generated/nestjs-dto/response.entity.ts
  import { ApiExtraModels } from '@nestjs/swagger';

  import { User } from './user.entity';
  import { Question } from './question.entity';

  @ApiExtraModels(User, Question)
  export class Response {
    id: string;
    createdAt: Date;
    createdBy?: User;
    createdById: string;
    updatedAt: Date;
    updatedBy?: User;
    updatedById: string;
    question?: Question;
    questionId: string;
    parentResponseId: string | null;
    parentResponse?: Response | null;
    responses?: Response[];
    title: string;
    content: string;
  }
  ```

</details>

## <a name="principles"></a>Principles

Generally we read field properties from the `DMMF.Field` information provided by `@prisma/generator-helper`. Since a few scenarios don't become quite clear from that, we also check for additional `decorators` in a field's `documentation` (that is anything provided as a tripple-slash `///` comment for that field in your `prisma.schema`).

Initially, we wanted `DTO` classes to `implement Prisma.<ModelName><(Create|Update)>Input` but that turned out to conflict with **required** relation fields.

### CreateDTO

This kind of DTO represents the structure of input-data to expect from 'outside' (e.g. REST API consumer) when attempting to `create` a new instance of a `Model`.
Typically the requirements for database schema differ from what we want to allow users to do.
As an example (and this is the opinion represented in this generator), we don't think that any `relation` (or relation scalar for that matter) field should go into the DTO. Instead, this information should be derived from context (e.g. HTTP path on the rest endpoint `/api/post/:postid/comment` to create a `Comment` with relation to a `Post`)

When generating a `Model`s `CreateDTO` class, field that meet any of the following conditions are omitted (**order matters**):

- `isReadOnly` OR has `@DtoReadOnly` in documentation (*Note:* this apparently includes relation scalar fields)
- field represents a relation (`field.kind === 'object'`)
- field is a [relation scalar](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/#annotated-relation-fields-and-relation-scalar-fields)
- field is not annotated with `@DtoCreateOptional` AND
  - `isId && hasDefaultValue` (id fields are not supposed to be provided by the user)
  - `isUpdatedAt` ([Prisma](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat) will inject value)
  - `isRequired && hasDefaultValue` (for schema-required fields that fallback to a default value when empty. Think: `createdAt` timestamps with `@default(now())` (see [now()](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#now)))

### UpdateDTO

When generating a `Model`s `UpdateDTO` class, field that meet any of the following conditions are omitted (**order matters**):

- field is annotated with `@DtoUpdateOptional`
- `isReadOnly` OR has `@DtoReadOnly` in documentation (*Note:* this apparently includes relation scalar fields)
- `isId` (id fields are not supposed to be updated by the user)
- field represents a relation (`field.kind === 'object'`)
- field is a [relation scalar](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/#annotated-relation-fields-and-relation-scalar-fields)
- field is not annotated with `@DtoUpdateOptional` AND
  - `isUpdatedAt` ([Prisma](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat) will inject value)

### Entity

When generating a `Model`s `Entity` class, only fields annotated with `@DtoEntityHidden` are omitted.
All other fields are only manipulated regarding their `isRequired` and `isNullable` flags.

By default, every scalar field in an entity is `required` meaning it doesn't get the TypeScript "optional member flag" `?` next to it's name. Fields that are marked as optional in PrismaSchema are treated as `nullable` - meaning their TypeScript type is a union of `field.type` and `null` (e.g. `string | null`).

Relation and [relation scalar](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/#annotated-relation-fields-and-relation-scalar-fields) fields are treated differently. If you don't specifically `include` a relation in your query, those fields will not exist in the response.

- every relation field is always optional (`isRequired = false`)
- relations are nullable except when
  - the relation field is a one-to-many or many-to-many type (would return empty array if no related records found)
  - the relation was originally flagged as required (`isRequired = true`)
  - the relation field is annotated with `@DtoRelationRequired` (do this when you make a relation as optional in PrismaSchema because you don't want (SQL) `ON DELETE CASCADE` behavior - but your logical data schema sees this relation as required)

## <a name="license"></a>License

All files are released under the [Apache License 2.0](https://github.com/vegardit/prisma-generator-nestjs-dto/blob/master/LICENSE).

# Prisma Generator NestJS DTO

[![Build Status](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto.svg?branch=master)](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto)
[![Release](https://badge.fury.io/js/%40vegardit%2Fprisma-generator-nestjs-dto.svg)](https://www.npmjs.com/package/@vegardit/prisma-generator-nestjs-dto)
[![License](https://img.shields.io/github/license/vegardit/prisma-generator-nestjs-dto.svg?label=license)](#license)

1. [What is it?](#what-is-it)
1. [Usage](#usage)
1. [Principles](#principles)
1. [License](#license)

## <a name="what-is-it"></a>What is it?

DTO is short for Data Transfer Object

## <a name="usage"></a>Usage?

```prisma
generator dto {
  provider     = "prisma-nestjs-dto-generator"
  output       = "../generated" /// relative output path
  filenameCase = "kebab" /// "kebab | "snake" | "camel" (default)
  dtoSuffix    = "Dto" /// (default = "Dto")
  classPrefix  = "Generated" /// (default = "")
}
```

### Options

## <a name="principles"></a>Principles

Generally we read field properties from the `DMMF.Field` information provided by `@prisma/generator-helper`. Since a few scenarios don't become quite clear from that, we also check for additional `decorators` in a field's `documentation` (that is anything provided as a tripple-slash `///` comment for that field in your `prisma.schema`).

Initially, we wanted `DTO` classes to `implement Prisma.<ModelName><(Create|Update)>Input` but that turned out to conflict with **required** relation fields.

### CreateDTO

This kind of DTO represents the structure of input-data to expect from 'outside' (e.g. REST API consumer) when attempting to `create` a new instance of the `Model` in question.
Typically the requirements for database schema differ quite a lot from what we want to allow our users to do.
As an example (and this is the opinion represented in this generator), we don't think that any `relation` (or relation scalar for that matter) field should go into the DTO. We'd expect this information to be derived from the context (e.g. HTTP path on the rest endpoint `/api/post/:postid/comment` when creating a `Comment` for a `Post`)
When generating a `Model`s `CreateDTO` class, we apply the following rules:

A Field is omitted when one of these conditions is met (**order matters**):

- `isReadOnly` OR has `@DtoReadOnly` in documentation
- field represents a relation (`kind === 'object'`)
- field is a [relation scalar](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/#annotated-relation-fields-and-relation-scalar-fields)
- field doesn't have `@DtoCreateOptional` in documentation AND
  - `isId && hasDefaultValue` (id fields are not supposed to be provided by the user)
  - `isUpdatedAt` ([Prisma](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat) will inject value)
  - `isRequired && hasDefaultValue` in documentation (for schema-required fields that receive generated values from Prisma and should not be editable by API users. Think: `createdAt` timestamps with `@default(now())` (see [now()](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#now)))

### UpdateDTO

A Field is omitted when one of these conditions is met (**order matters**):

- `isReadOnly` OR has `@DtoReadOnly` in documentation
- `isId` (id fields are not supposed to be updated by the user)
- field represents a relation (`kind === 'object'`)
- field is a [relation scalar](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/#annotated-relation-fields-and-relation-scalar-fields)
- field doesn't have `@DtoUpdateOptional` in documentation AND
  - `isUpdatedAt` ([Prisma](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#updatedat) will inject value)

## <a name="license"></a>License

All files are released under the [Apache License 2.0](https://github.com/vegardit/prisma-generator-nestjs-dto/blob/master/LICENSE).

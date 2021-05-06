# Prisma NestJS Dto Generator

This generator generates Dto files based on your Prisma schema

## To install

```bash
npm i @tpdewolf/prisma-nestjs-dto-generator
```

## Add the generator to your schema

```
generator dto {
  provider     = "prisma-nestjs-dto-generator"
  output       = "../generated" /// relative output path
  filenameCase = "kebab" /// "kebab | "snake" | "camel" (default)
  dtoSuffix    = "Dto" /// (default = "Dto")
  classPrefix  = "Generated" /// (default = "")
}
```

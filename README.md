# Prisma Generator NestJS DTO

[![Build Status](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto.svg?branch=master)](https://travis-ci.org/vegardit/prisma-generator-nestjs-dto)
[![Release](https://badge.fury.io/js/%40vegardit%2Fprisma-generator-nestjs-dto.svg)](https://www.npmjs.com/package/@vegardit/prisma-generator-nestjs-dto)
[![License](https://img.shields.io/github/license/vegardit/prisma-generator-nestjs-dto.svg?label=license)](#license)

1. [What is it?](#what-is-it)
1. [Usage](#usage)
1. [License](#license)


## <a name="what-is-it"></a>What is it?


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

## <a name="license"></a>License

All files are released under the [Apache License 2.0](https://github.com/vegardit/prisma-generator-nestjs-dto/blob/master/LICENSE).

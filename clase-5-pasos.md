# De auth con JWT a ecommerce marketplace: guia paso a paso

## Como usar esta guia

Esta guia esta pensada para continuar el repo actual desde el estado que ya tiene:

- autenticacion con JWT
- modulo `users`
- MongoDB con Mongoose
- arquitectura por capas `controller -> service -> repository -> dao`

La idea es que sirva para una clase, no solo como lista de tareas.

Por eso cada seccion intenta responder cuatro preguntas:

- que cambiamos
- en que archivo va
- por que conviene hacerlo asi
- como probarlo antes de seguir

Clave importante de esta clase:

- vamos a trabajar en checkpoints chicos
- cada checkpoint deja la app funcionando
- cada checkpoint agrega una capacidad visible nueva
- si algo falla, se puede volver al ultimo checkpoint estable

### Referencia rapida para pruebas manuales

Cuando en esta guia probemos con Postman o Thunder, asumir siempre esto:

- endpoint publico: no necesita token
- endpoint privado: necesita `Authorization: Bearer <access_token>`
- el `access_token` sale de `POST /auth/login`
- si recien registraste usuario, hace login despues de `POST /auth/register`
- en Postman o Thunder podes cargarlo como Bearer Token o escribir el header manualmente

La referencia funcional y tecnica de esta guia sale de:

- `.kiro/specs/ecommerce-marketplace/requirements.md`
- `.kiro/specs/ecommerce-marketplace/design.md`
- `.kiro/specs/ecommerce-marketplace/tasks.md`
- `.kiro/specs/ecommerce-marketplace/key-flows.md`
- `.kiro/specs/ecommerce-marketplace/er-diagram.md`

---

## Seccion 1 - Punto de partida real

Hoy el repo ya tiene esta base:

```text
src/
├── app.module.ts
├── main.ts
└── users/
    ├── controllers/
    │   ├── auth.controller.ts
    │   └── users.controller.ts
    ├── dao/
    │   └── users.mongoose.dao.ts
    ├── dto/
    │   ├── create-user.dto.ts
    │   ├── login-user.dto.ts
    │   └── user-response.dto.ts
    ├── guards/
    │   └── jwt-auth.guard.ts
    ├── repositories/
    │   └── users.repository.ts
    ├── schemas/
    │   └── user.schema.ts
    ├── services/
    │   ├── auth.service.ts
    │   └── users.service.ts
    ├── strategies/
    │   └── jwt.strategy.ts
    └── users.module.ts
```

Endpoints ya disponibles:

- `POST /auth/register` (publico)
- `POST /auth/login` (publico, devuelve `access_token`)
- `GET /auth/profile` (privado, requiere `Authorization: Bearer <access_token>`)
- CRUD protegido de `users` (privado, requiere JWT)

### Por que este punto de partida es bueno

Porque ya resolvimos dos problemas importantes:

- identidad del usuario con JWT
- persistencia con una arquitectura minima ordenada

Eso nos deja listos para la siguiente pregunta de negocio:

- como publican productos esos usuarios

---

## Seccion 2 - Objetivo final del marketplace

Queremos llegar a una primera version donde:

- un usuario autenticado pueda publicar productos
- cada producto tenga una categoria hardcodeada valida
- cada producto tenga una o mas opciones de pago hardcodeadas
- el producto pueda incluir imagenes base64
- cualquier visitante pueda ver productos activos
- solo el creador pueda editar o eliminar su producto
- usuarios autenticados puedan comentar productos
- los comentarios no sean publicos
- cada usuario pueda guardar favoritos

### Estructura objetivo

```text
src/products/
├── constants/
│   ├── product-category.enum.ts
│   └── payment-option.enum.ts
├── controllers/
│   ├── favorites.controller.ts
│   ├── product-comments.controller.ts
│   ├── products.controller.ts
│   └── public-products.controller.ts
├── dao/
│   ├── favorites.mongoose.dao.ts
│   ├── product-comments.mongoose.dao.ts
│   └── products.mongoose.dao.ts
├── dto/
│   ├── create-comment.dto.ts
│   ├── create-product.dto.ts
│   ├── favorite-response.dto.ts
│   ├── list-products-query.dto.ts
│   ├── product-comment-response.dto.ts
│   ├── product-response.dto.ts
│   ├── public-product-responde.dto.ts
│   └── update-product.dto.ts
├── repositories/
│   ├── favorites.repository.ts
│   ├── product-comments.repository.ts
│   └── products.repository.ts
├── schemas/
│   ├── favorite.schema.ts
│   ├── product-comment.schema.ts
│   └── product.schema.ts
├── services/
│   ├── favorites.service.ts
│   ├── product-comments.service.ts
│   └── products.service.ts
└── products.module.ts
```

### Idea pedagogica

No vamos a construir todo eso de una sola vez.

Vamos a hacerlo en 5 checkpoints:

1. publicacion minima de productos
2. ownership y ciclo de vida del producto
3. comentarios autenticados
4. favoritos por usuario
5. hardening, helpers y tests

---

## Seccion 3 - Checkpoint 0: modulo listo sin romper nada

### Paso 1 - Crear `ProductsModule` vacio y registrarlo

### Que hacemos

Creamos el modulo nuevo aunque todavia no tenga controllers ni providers.

### Archivos

- `src/products/products.module.ts`
- `src/app.module.ts`

### Snippet

```ts
// src/products/products.module.ts
import { Module } from '@nestjs/common';

@Module({})
export class ProductsModule {}
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Por que lo hacemos

Porque primero queremos abrir el espacio del modulo sin meter todavia logica de negocio.

Esto sirve para:

- que la estructura sea clara desde el principio
- evitar mezclar productos dentro de `users`
- poder avanzar por capas sin romper auth

### Buena practica

Crear el modulo temprano ayuda a que los alumnos entiendan desde el inicio donde va a vivir cada feature.

### Error comun

Meter productos dentro de `src/users/` "porque ya existe".

Eso hace que el proyecto funcione hoy, pero quede mal separado manana.

### Checkpoint rapido

Si hasta aca esta bien:

- la app sigue levantando
- no cambia ningun endpoint existente
- `ProductsModule` ya esta registrado

---

## Seccion 4 - Checkpoint 1: publicacion minima de productos

Objetivo del checkpoint:

- un usuario autenticado puede crear un producto
- cualquier visitante puede verlo en listado y detalle publico

---

### Paso 2 - Definir categorias y opciones de pago hardcodeadas

### Que hacemos

Creamos enums dentro de `src/products/constants/`.

### Archivos

- `src/products/constants/product-category.enum.ts`
- `src/products/constants/payment-option.enum.ts`

### Snippet

```ts
// src/products/constants/product-category.enum.ts
export enum ProductCategory {
  BREAD = 'bread',
  PASTRY = 'pastry',
  SANDWICH = 'sandwich',
  SALAD = 'salad',
  DRINK = 'drink',
  DESSERT = 'dessert',
}
```

```ts
// src/products/constants/payment-option.enum.ts
export enum PaymentOption {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  MERCADO_PAGO = 'mercado_pago',
}
```

### Por que lo hacemos

La spec pide explicitamente que estas listas sean hardcodeadas.

Eso significa:

- no van en MongoDB
- no necesitan modulo propio
- no necesitan endpoints propios

### Concepto clave

Un enum nos da dos ventajas al mismo tiempo:

- documenta los valores permitidos
- sirve para validar DTOs y schemas

### Buena practica

Si negocio cambia la lista, solo editamos un archivo fuente de verdad.

Si ya tienen la lista real de categorias y medios de pago desde negocio, reemplacen estos valores ejemplo.

Lo importante no es el texto exacto del enum, sino que la fuente de verdad viva en codigo y no en MongoDB.

### Error comun

Crear una coleccion `categories` por costumbre aunque el requerimiento diga que no hace falta.

---

### Paso 3 - Modelar `Product` y sus DTOs base

### Que hacemos

Definimos el documento principal del marketplace y el contrato de entrada/salida para crear productos.

### Archivos

- `src/products/schemas/product.schema.ts`
- `src/products/dto/create-product.dto.ts`
- `src/products/dto/product-response.dto.ts`
- `src/products/dto/public-product-responde.dto.ts`

### Snippet

```ts
// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, min: 0.01 })
  price: number;

  @Prop({
    type: String,
    enum: ProductCategory,
    required: true,
    index: true,
  })
  category: ProductCategory;

  @Prop({
    type: [String],
    enum: PaymentOption,
    required: true,
    default: [],
    index: true,
  })
  paymentOptions: PaymentOption[];

  @Prop({ type: [String], default: [] })
  imagesBase64: string[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
```

```ts
// src/products/dto/create-product.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PaymentOption, { each: true })
  paymentOptions: PaymentOption[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Matches(/^(data:image\/[a-zA-Z0-9.+-]+;base64,)?[A-Za-z0-9+/]+=*$/, {
    each: true,
    message: 'Each image must be a valid base64 string',
  })
  imagesBase64?: string[];
}
```

```ts
// src/products/dto/product-response.dto.ts
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class ProductResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  paymentOptions: PaymentOption[];
  imagesBase64: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductResponseDto>) {
    Object.assign(this, partial);
  }
}
```

```ts
// src/products/dto/public-product-responde.dto.ts
import { ProductResponseDto } from './product-response.dto';

export class PublicProductOwnerDto {
  id: string;
  name: string;
  surname: string;
}

export class PublicProductResponseDto extends ProductResponseDto {
  owner: PublicProductOwnerDto;
}
```

### Por que lo hacemos

Este paso define el dominio minimo del producto.

La spec dice que un producto necesita:

- `ownerId`
- `name`
- `description`
- `price`
- `category`
- `paymentOptions`
- `imagesBase64`
- `isActive`

### Concepto clave

`isActive` nos prepara para baja logica.

Eso es mejor que borrar fisicamente el documento si despues queremos:

- ocultarlo del catalogo
- conservar trazabilidad
- seguir enlazando comentarios o favoritos historicos

### Buena practica

Separar DTO de entrada y DTO de salida, aunque los campos se parezcan mucho.

### Error comun

Guardar `ownerId` en el body del cliente.

Ese dato tiene que salir del JWT, no de lo que mande el frontend.

En el estado actual del repo, `req.user.userId` llega como `string` desde la `JwtStrategy` y la conversion a `Types.ObjectId` se hace dentro del service o del DAO cuando hace falta persistir o filtrar por owner.

---

### Paso 4 - Crear DAO y repository de productos

### Que hacemos

Copiamos el patron que ya usa `users` para que `products` quede consistente con la clase anterior.

### Archivos

- `src/products/dao/products.mongoose.dao.ts`
- `src/products/repositories/products.repository.ts`

### Snippet

```ts
// src/products/dao/products.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';

export interface IProductsDao {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsMongooseDao implements IProductsDao {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  async findPublic(): Promise<Product[]> {
    return this.productModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.productModel.findOne({ _id: id, isActive: true }).exec();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }
}
```

```ts
// src/products/repositories/products.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../schemas/product.schema';
import type { IProductsDao } from '../dao/products.mongoose.dao';

export interface IProductsRepository {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(
    @Inject('IProductsDao')
    private readonly dao: IProductsDao,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    return this.dao.create(productData);
  }

  async findPublic(): Promise<Product[]> {
    return this.dao.findPublic();
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.dao.findPublicById(id);
  }

  async findById(id: string): Promise<Product | null> {
    return this.dao.findById(id);
  }
}
```

### Por que lo hacemos

Podriamos hablar con Mongoose directo desde el service, pero el repo ya eligio otra arquitectura.

Conviene mantenerla para que los alumnos vean consistencia entre modulos.

### Concepto clave

El repository abstrae persistencia.

Eso significa que el service piensa en reglas de negocio y no en detalles de `Model.find()`.

### Error comun

Duplicar validaciones de negocio dentro del DAO.

La validacion del negocio va en service.

---

### Paso 5 - Crear `ProductsService` con la vertical minima

### Archivos

- `src/products/services/products.service.ts`

### Snippet

```ts
// src/products/services/products.service.ts
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/users.service';
import { CreateProductDto } from '../dto/create-product.dto';
import {
  PublicProductOwnerDto,
  PublicProductResponseDto,
} from '../dto/public-product-responde.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import type { IProductsRepository } from '../repositories/products.repository';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('IProductsRepository')
    private readonly productsRepository: IProductsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    ownerId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.productsRepository.create({
        ...createProductDto,
        ownerId: new Types.ObjectId(ownerId),
        imagesBase64: createProductDto.imagesBase64 ?? [],
        isActive: true,
      });

      return this.toProductResponse(product);
    } catch {
      throw new InternalServerErrorException('Could not create product');
    }
  }

  async findPublic(): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findPublic();
    return products.map((product) => this.toProductResponse(product));
  }

  async findPublicById(id: string): Promise<PublicProductResponseDto> {
    const product = await this.productsRepository.findPublicById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const owner = await this.usersService.findById(product.ownerId.toString());

    return {
      ...this.toProductResponse(product),
      owner: {
        id: product.ownerId.toString(),
        name: owner.name,
        surname: owner.surname,
      } as PublicProductOwnerDto,
    };
  }

  private toProductResponse(product: Product): ProductResponseDto {
    return plainToClass(ProductResponseDto, {
      id: product._id.toString(),
      ownerId: product.ownerId.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      paymentOptions: product.paymentOptions,
      imagesBase64: product.imagesBase64,
      isActive: product.isActive
    });
  }
}
```

### Por que lo hacemos

Este service ya resuelve la primera vertical completa:

- crear producto
- listar productos publicos
- ver detalle publico

### Concepto clave

El detalle publico incluye datos basicos del creador, pero no devuelve password ni informacion sensible.

Eso conecta directo con el requerimiento de seguridad del spec.

### Error comun

Devolver el documento crudo de Mongo al cliente y confiar en que "despues el frontend usa solo lo que necesita".

---

### Paso 6 - Crear controllers publico y autenticado

### Archivos

- `src/products/controllers/products.controller.ts`
- `src/products/controllers/public-products.controller.ts`

### Snippet

```ts
// src/products/controllers/products.controller.ts
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.create(req.user.userId, createProductDto);
  }
}
```

```ts
// src/products/controllers/public-products.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from '../services/products.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findPublic();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findPublicById(id);
  }
}
```

### Por que lo hacemos

Separamos endpoints por contexto de acceso:

- `products` para operaciones autenticadas (privado, con JWT)
- `public/products` para lectura publica (publico, sin JWT)

### Concepto clave

No todas las lecturas deben exigir JWT.

En un marketplace real, el catalogo publico es justamente la puerta de entrada.

### Buena practica

Mantener el `JwtAuthGuard` a nivel controller cuando todas las rutas del controller son privadas.

### Error comun

Poner comentarios o favoritos dentro del mismo controller de productos desde el dia uno.

Conviene que cada controller responda a un recurso o flujo claro.

---

### Paso 7 - Completar `ProductsModule`

### Archivos

- `src/products/products.module.ts`

### Snippet

```ts
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProductsController } from './controllers/products.controller';
import { PublicProductsController } from './controllers/public-products.controller';
import { ProductsMongooseDao } from './dao/products.mongoose.dao';
import { ProductsRepository } from './repositories/products.repository';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsController, PublicProductsController],
  providers: [
    ProductsService,
    {
      provide: 'IProductsDao',
      useClass: ProductsMongooseDao,
    },
    {
      provide: 'IProductsRepository',
      useClass: ProductsRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Por que lo hacemos

Este paso termina de conectar la feature dentro de Nest:

- schema
- dao
- repository
- service
- controllers

### Checkpoint funcional

Al cerrar este checkpoint ya deberia funcionar:

- `POST /products` (privado, requiere `Authorization: Bearer <access_token>`)
- `GET /public/products` (publico)
- `GET /public/products/:id` (publico)

### Payload de prueba para `POST /products`

```json
{
  "name": "Sourdough Bread",
  "description": "Pan de masa madre horneado en el dia",
  "price": 18.5,
  "category": "bread",
  "paymentOptions": ["cash", "mercado_pago"],
  "imagesBase64": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
  ]
}
```

### Que deberia pasar

1. Registrar usuario con `POST /auth/register` (publico)
2. Loguear con `POST /auth/login` (publico) y copiar `access_token`
3. Crear producto con `POST /products` (privado) enviando `Authorization: Bearer <access_token>`
4. Verlo desde `GET /public/products` (publico, sin token)
5. Ver detalle desde `GET /public/products/:id` (publico, sin token)

### Recordatorio para Postman o Thunder

- `POST /products` es privado: sin Bearer token deberia responder `401`
- `GET /public/products` y `GET /public/products/:id` son publicos: se prueban sin token

---

## Seccion 5 - Checkpoint 2: ownership y ciclo de vida del producto

Objetivo del checkpoint:

- el creador puede listar sus productos
- el creador puede editar
- el creador puede eliminar con baja logica
- otro usuario no puede modificar un producto ajeno
- el catalogo publico acepta filtros basicos

---

### Paso 8 - Agregar DTOs para update y filtros publicos

### Archivos

- `src/products/dto/update-product.dto.ts`
- `src/products/dto/list-products-query.dto.ts`

### Snippet

```ts
// src/products/dto/update-product.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price?: number;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PaymentOption, { each: true })
  paymentOptions?: PaymentOption[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Matches(/^(data:image\/[a-zA-Z0-9.+-]+;base64,)?[A-Za-z0-9+/]+=*$/, {
    each: true,
    message: 'Each image must be a valid base64 string',
  })
  imagesBase64?: string[];
}
```

#### Este DTO es especifico para querys que vienen en URL.

```ts
// src/products/dto/list-products-query.dto.ts
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class ListProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsEnum(PaymentOption)
  paymentOption?: PaymentOption;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
```

### Por que lo hacemos

Crear no es lo mismo que editar.

Tampoco es lo mismo validar un body que validar query params. 

### Concepto clave

El DTO de query nos permite aprovechar `ValidationPipe` tambien en el listado publico.

---

### Paso 9 - Expandir DAO, repository y service para filtros, `mine`, update y delete

Ya implementamos los DTO, ahora vamos a implementar los servicio y metodos para poder filtrar productos en base a querys. Tambien update y delete.

### Archivos a reemplazar

- `src/products/dao/products.mongoose.dao.ts`
- `src/products/repositories/products.repository.ts`
- `src/products/services/products.service.ts`

### Snippet

```ts
// src/products/dao/products.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { Product } from '../schemas/product.schema';

type ProductPublicFilters = {
  isActive: boolean;
  category?: ListProductsQueryDto['category'];
  paymentOptions?: ListProductsQueryDto['paymentOption'];
  ownerId?: Types.ObjectId;
  price?: {
    $gte?: number;
    $lte?: number;
  };
};

export interface IProductsDao {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(query: ListProductsQueryDto): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findMine(ownerId: string): Promise<Product[]>;
  update(id: string, updateData: Partial<Product>): Promise<Product | null>;
  softDelete(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsMongooseDao implements IProductsDao {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  async findPublic(query: ListProductsQueryDto): Promise<Product[]> {
    const filters: ProductPublicFilters = { isActive: true };

    if (query.category) {
      filters.category = query.category;
    }

    if (query.paymentOption) {
      filters.paymentOptions = query.paymentOption;
    }

    if (query.ownerId) {
      filters.ownerId = new Types.ObjectId(query.ownerId);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.price = {};

      if (query.minPrice !== undefined) {
        filters.price.$gte = query.minPrice;
      }

      if (query.maxPrice !== undefined) {
        filters.price.$lte = query.maxPrice;
      }
    }

    return this.productModel
      .find(filters as Record<string, unknown>)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.productModel.findOne({ _id: id, isActive: true }).exec();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async findMine(ownerId: string): Promise<Product[]> {
    return this.productModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async softDelete(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}
```

```ts
// src/products/repositories/products.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IProductsDao } from '../dao/products.mongoose.dao';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { Product } from '../schemas/product.schema';

export interface IProductsRepository {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(query: ListProductsQueryDto): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findMine(ownerId: string): Promise<Product[]>;
  update(id: string, updateData: Partial<Product>): Promise<Product | null>;
  softDelete(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(
    @Inject('IProductsDao')
    private readonly dao: IProductsDao,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    return this.dao.create(productData);
  }

  async findPublic(query: ListProductsQueryDto): Promise<Product[]> {
    return this.dao.findPublic(query);
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.dao.findPublicById(id);
  }

  async findById(id: string): Promise<Product | null> {
    return this.dao.findById(id);
  }

  async findMine(ownerId: string): Promise<Product[]> {
    return this.dao.findMine(ownerId);
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product | null> {
    return this.dao.update(id, updateData);
  }

  async softDelete(id: string): Promise<Product | null> {
    return this.dao.softDelete(id);
  }
}
```

```ts
// src/products/services/products.service.ts
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/users.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import {
  PublicProductOwnerDto,
  PublicProductResponseDto,
} from '../dto/public-product-responde.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import type { IProductsRepository } from '../repositories/products.repository';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('IProductsRepository')
    private readonly productsRepository: IProductsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    ownerId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.productsRepository.create({
        ...createProductDto,
        ownerId: new Types.ObjectId(ownerId),
        imagesBase64: createProductDto.imagesBase64 ?? [],
        isActive: true,
      });

      return this.toProductResponse(product);
    } catch {
      throw new InternalServerErrorException('Could not create product');
    }
  }

  async findPublic(query: ListProductsQueryDto = {}): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findPublic(query);
    return products.map((product) => this.toProductResponse(product));
  }

  async findPublicById(id: string): Promise<PublicProductResponseDto> {
    const product = await this.findActiveEntityOrThrow(id);
    const owner = await this.usersService.findById(product.ownerId.toString());

    return {
      ...this.toProductResponse(product),
      owner: {
        id: product.ownerId.toString(),
        name: owner.name,
        surname: owner.surname,
      } as PublicProductOwnerDto,
    };
  }

  async findMine(ownerId: string): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findMine(ownerId);
    return products.map((product) => this.toProductResponse(product));
  }

  async update(
    productId: string,
    userId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    await this.findOwnedEntityOrThrow(productId, userId);

    const updatedProduct = await this.productsRepository.update(
      productId,
      updateProductDto,
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return this.toProductResponse(updatedProduct);
  }

  async delete(productId: string, userId: string) {
    await this.findOwnedEntityOrThrow(productId, userId);
    await this.productsRepository.softDelete(productId);

    return {
      message: 'Product deleted successfully',
    };
  }

  async findActiveEntityOrThrow(id: string): Promise<Product> {
    const product = await this.productsRepository.findPublicById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findOwnedEntityOrThrow(id: string, userId: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    return product;
  }

  private toProductResponse(product: Product): ProductResponseDto {
    return plainToClass(ProductResponseDto, {
      id: product._id.toString(),
      ownerId: product.ownerId.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      paymentOptions: product.paymentOptions,
      imagesBase64: product.imagesBase64,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
```

### Por que lo hacemos

Este es el checkpoint donde aparece ownership en serio.

La regla del negocio ahora es:

- cualquiera puede ver
- solo el owner puede cambiar

### Concepto clave

`findOwnedEntityOrThrow()` concentra la regla mas importante del modulo.

Eso evita repetir en varios metodos:

- buscar el producto
- chequear si existe
- comparar `ownerId`
- devolver `403` si no coincide

### Buena practica

Las operaciones publicas usan `findPublicById`.

Las operaciones privadas usan `findById`.

Eso evita confundir "producto existe" con "producto esta visible publicamente".

Y es clave que la funcionalidad repetida en diferentes servicios se extraiga en una función a parte y luego sea llamada en los diferentes servivios donde este utilziada. Y NO copiar el mismo bloque de codigo en todas los servicio o metodos.

---

### Paso 10 - Actualizar controllers con `mine`, `PATCH`, `DELETE` y filtros

### Archivos a reemplazar

- `src/products/controllers/products.controller.ts`
- `src/products/controllers/public-products.controller.ts`

### Snippet

```ts
// src/products/controllers/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.create(req.user.userId, createProductDto);
  }

  @Get('mine')
  async findMine(@Request() req: { user: { userId: string } }) {
    return this.productsService.findMine(req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.update(id, req.user.userId, updateProductDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.delete(id, req.user.userId);
  }
}
```

```ts
// src/products/controllers/public-products.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ProductsService } from '../services/products.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findPublicById(id);
  }
}
```

### Por que lo hacemos

Ahora el modulo ya cubre el ciclo minimo de vida del producto:

- crear
- listar publicamente
- listar lo mio
- editar
- eliminar

### Checkpoint funcional

Al cerrar este checkpoint deberia pasar esto:

1. Usuario A crea un producto con `POST /products` (privado, requiere Bearer token del usuario A)
2. Usuario A lo ve en `GET /products/mine` (privado, requiere Bearer token del usuario A)
3. Usuario A lo edita con `PATCH /products/:id` (privado, requiere Bearer token del usuario A)
4. Usuario B intenta editar el mismo producto con `PATCH /products/:id` (privado, requiere Bearer token del usuario B) y recibe `403`
5. Usuario A lo elimina con `DELETE /products/:id` (privado, requiere Bearer token del usuario A)
6. El producto ya no aparece en `GET /public/products` (publico)

### Payload de prueba para `PATCH /products/:id`

```json
{
  "price": 21,
  "paymentOptions": ["cash", "bank_transfer"]
}
```

### Recordatorio para Postman o Thunder

- `GET /products/mine`, `PATCH /products/:id` y `DELETE /products/:id` son privados
- en esas requests hace falta `Authorization: Bearer <access_token>`
- los filtros sobre `GET /public/products` siguen siendo publicos y se prueban sin token

### Filtros utiles para probar

Todos estos ejemplos usan `GET /public/products`, asi que son pruebas de endpoint publico y no requieren token:

- `GET /public/products?category=bread`
- `GET /public/products?  =mercado_pago`
- `GET /public/products?ownerId=<userId>`
- `GET /public/products?minPrice=10&maxPrice=30`

### Nota de compatibilidad

En este repo estamos usando `mongoose@9`, asi que en el DAO conviene tipar los filtros con un tipo local del recurso en vez de depender de `FilterQuery`, que cambio respecto de versiones anteriores.

---

## Seccion 6 - Checkpoint 3: comentarios autenticados por producto

Objetivo del checkpoint:

- cualquier usuario autenticado puede comentar un producto activo
- solo usuarios autenticados pueden ver comentarios
- el historial es plano y cronologico

---

### Paso 11 - Modelar comentarios y su capa de persistencia

### Archivos

- `src/products/schemas/product-comment.schema.ts`
- `src/products/dto/create-comment.dto.ts`
- `src/products/dto/product-comment-response.dto.ts`
- `src/products/dao/product-comments.mongoose.dao.ts`
- `src/products/repositories/product-comments.repository.ts`

### Snippet

```ts
// src/products/schemas/product-comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from './product.schema';

@Schema({ timestamps: true })
export class ProductComment extends Document {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  message: string;
}

export const ProductCommentSchema = SchemaFactory.createForClass(ProductComment);
```

```ts
// src/products/dto/create-comment.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  message: string;
}
```

```ts
// src/products/dto/product-comment-response.dto.ts
export class ProductCommentAuthorDto {
  id: string;
  name: string;
  surname: string;
}

export class ProductCommentResponseDto {
  id: string;
  productId: string;
  authorId: string;
  message: string;
  author: ProductCommentAuthorDto;
  createdAt: Date;
  updatedAt: Date;
}
```

```ts
// src/products/dao/product-comments.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductComment } from '../schemas/product-comment.schema';

export interface IProductCommentsDao {
  create(commentData: Partial<ProductComment>): Promise<ProductComment>;
  findByProductId(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsMongooseDao implements IProductCommentsDao {
  constructor(
    @InjectModel(ProductComment.name)
    private readonly productCommentModel: Model<ProductComment>,
  ) {}

  async create(commentData: Partial<ProductComment>): Promise<ProductComment> {
    const createdComment = new this.productCommentModel(commentData);
    return createdComment.save();
  }

  async findByProductId(productId: string): Promise<ProductComment[]> {
    return this.productCommentModel
      .find({ productId })
      .sort({ createdAt: 1 })
      .exec();
  }
}
```

```ts
// src/products/repositories/product-comments.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IProductCommentsDao } from '../dao/product-comments.mongoose.dao';
import { ProductComment } from '../schemas/product-comment.schema';

export interface IProductCommentsRepository {
  create(commentData: Partial<ProductComment>): Promise<ProductComment>;
  findByProductId(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsRepository implements IProductCommentsRepository {
  constructor(
    @Inject('IProductCommentsDao')
    private readonly dao: IProductCommentsDao,
  ) {}

  async create(commentData: Partial<ProductComment>): Promise<ProductComment> {
    return this.dao.create(commentData);
  }

  async findByProductId(productId: string): Promise<ProductComment[]> {
    return this.dao.findByProductId(productId);
  }
}
```

### Por que lo hacemos

La spec aclara que los comentarios no son replies ni arbol.

Entonces el modelo correcto es simple:

- `productId`
- `authorId`
- `message`
- timestamps

### Concepto clave

No existe `parentCommentId`.

Eso evita sobre-diseniar una feature que el requerimiento no pide.

---

### Paso 12 - Crear service y controller de comentarios

### Archivos

- `src/products/services/product-comments.service.ts`
- `src/products/controllers/product-comments.controller.ts`

### Snippet

```ts
// src/products/services/product-comments.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ProductCommentResponseDto } from '../dto/product-comment-response.dto';
import type { IProductCommentsRepository } from '../repositories/product-comments.repository';
import { ProductComment } from '../schemas/product-comment.schema';
import { ProductsService } from './products.service';

@Injectable()
export class ProductCommentsService {
  constructor(
    @Inject('IProductCommentsRepository')
    private readonly productCommentsRepository: IProductCommentsRepository,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    productId: string,
    authorId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<ProductCommentResponseDto> {
    await this.productsService.findActiveEntityOrThrow(productId);

    const comment = await this.productCommentsRepository.create({
      productId,
      authorId,
      message: createCommentDto.message,
    });

    return this.toCommentResponse(comment);
  }

  async findByProductId(productId: string): Promise<ProductCommentResponseDto[]> {
    await this.productsService.findActiveEntityOrThrow(productId);

    const comments = await this.productCommentsRepository.findByProductId(productId);

    return Promise.all(
      comments.map((comment) => this.toCommentResponse(comment)),
    );
  }

  private async toCommentResponse(
    comment: ProductComment,
  ): Promise<ProductCommentResponseDto> {
    const author = await this.usersService.findById(comment.authorId.toString());

    return {
      id: comment._id.toString(),
      productId: comment.productId.toString(),
      authorId: comment.authorId.toString(),
      message: comment.message,
      author: {
        id: comment.authorId.toString(),
        name: author.name,
        surname: author.surname,
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
```

```ts
// src/products/controllers/product-comments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ProductCommentsService } from '../services/product-comments.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductCommentsController {
  constructor(
    private readonly productCommentsService: ProductCommentsService,
  ) {}

  @Post(':id/comments')
  async create(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productCommentsService.create(
      id,
      req.user.userId,
      createCommentDto,
    );
  }

  @Get(':id/comments')
  async findByProductId(@Param('id') id: string) {
    return this.productCommentsService.findByProductId(id);
  }
}
```

### Por que lo hacemos

Este service reusa dos piezas ya existentes:

- `ProductsService` para validar que el producto exista y este activo
- `UsersService` para enriquecer el autor sin exponer password

### Concepto clave

Los comentarios son privados para autenticados.

Por eso no viven debajo de `public/products`.

### Error comun

Agregar comentarios al response de `GET /public/products/:id`.

La spec dice explicitamente que no deben estar ahi.

---

### Paso 13 - Actualizar `ProductsModule` para comentarios

### Archivo a reemplazar

- `src/products/products.module.ts`

### Snippet

```ts
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProductCommentsController } from './controllers/product-comments.controller';
import { ProductsController } from './controllers/products.controller';
import { PublicProductsController } from './controllers/public-products.controller';
import { ProductCommentsMongooseDao } from './dao/product-comments.mongoose.dao';
import { ProductsMongooseDao } from './dao/products.mongoose.dao';
import { ProductCommentsRepository } from './repositories/product-comments.repository';
import { ProductsRepository } from './repositories/products.repository';
import {
  ProductComment,
  ProductCommentSchema,
} from './schemas/product-comment.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductCommentsService } from './services/product-comments.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductComment.name, schema: ProductCommentSchema },
    ]),
  ],
  controllers: [
    ProductsController,
    PublicProductsController,
    ProductCommentsController,
  ],
  providers: [
    ProductsService,
    ProductCommentsService,
    {
      provide: 'IProductsDao',
      useClass: ProductsMongooseDao,
    },
    {
      provide: 'IProductsRepository',
      useClass: ProductsRepository,
    },
    {
      provide: 'IProductCommentsDao',
      useClass: ProductCommentsMongooseDao,
    },
    {
      provide: 'IProductCommentsRepository',
      useClass: ProductCommentsRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Checkpoint funcional

Al cerrar este checkpoint deberia pasar esto:

1. Crear un producto con `POST /products` (privado, requiere Bearer token)
2. Comentar con un usuario autenticado en `POST /products/:id/comments` (privado, requiere Bearer token)
3. Leer comentarios con otro usuario autenticado en `GET /products/:id/comments` (privado, requiere Bearer token)
4. Intentar leer comentarios sin JWT y recibir `401`
5. Confirmar que el detalle publico del producto sigue sin comentarios desde `GET /public/products/:id` (publico)

### Payload de prueba para `POST /products/:id/comments`

```json
{
  "message": "Me interesa, aceptas entrega manana?"
}
```

### Recordatorio para Postman o Thunder

- `POST /products/:id/comments` y `GET /products/:id/comments` son privados
- para ambos hace falta enviar `Authorization: Bearer <access_token>`
- si queres comprobar el `401`, hace la misma request sin header `Authorization`

---

## Seccion 7 - Checkpoint 4: favoritos por usuario

Objetivo del checkpoint:

- cada usuario puede guardar productos
- no hay duplicados
- cada usuario consulta solo sus favoritos

---

### Paso 14 - Modelar favoritos y su persistencia

### Archivos

- `src/products/schemas/favorite.schema.ts`
- `src/products/dto/favorite-response.dto.ts`
- `src/products/dao/favorites.mongoose.dao.ts`
- `src/products/repositories/favorites.repository.ts`

### Snippet

```ts
// src/products/schemas/favorite.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from './product.schema';

@Schema({ timestamps: true })
export class Favorite extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });
```

```ts
// src/products/dto/favorite-response.dto.ts
import { ProductCategory } from '../constants/product-category.enum';

export class FavoriteResponseDto {
  favoriteId: string;
  productId: string;
  savedAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
    category: ProductCategory;
    isActive: boolean;
  };
}
```

```ts
// src/products/dao/favorites.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from '../schemas/favorite.schema';

export interface IFavoritesDao {
  create(favoriteData: Partial<Favorite>): Promise<Favorite>;
  findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null>;
  findByUserId(userId: string): Promise<Favorite[]>;
  deleteByUserAndProduct(userId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class FavoritesMongooseDao implements IFavoritesDao {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<Favorite>,
  ) {}

  async create(favoriteData: Partial<Favorite>): Promise<Favorite> {
    const favorite = new this.favoriteModel(favoriteData);
    return favorite.save();
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Favorite | null> {
    return this.favoriteModel.findOne({ userId, productId }).exec();
  }

  async findByUserId(userId: string): Promise<Favorite[]> {
    return this.favoriteModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const result = await this.favoriteModel.findOneAndDelete({
      userId,
      productId,
    }).exec();

    return result !== null;
  }
}
```

```ts
// src/products/repositories/favorites.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IFavoritesDao } from '../dao/favorites.mongoose.dao';
import { Favorite } from '../schemas/favorite.schema';

export interface IFavoritesRepository {
  create(favoriteData: Partial<Favorite>): Promise<Favorite>;
  findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null>;
  findByUserId(userId: string): Promise<Favorite[]>;
  deleteByUserAndProduct(userId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class FavoritesRepository implements IFavoritesRepository {
  constructor(
    @Inject('IFavoritesDao')
    private readonly dao: IFavoritesDao,
  ) {}

  async create(favoriteData: Partial<Favorite>): Promise<Favorite> {
    return this.dao.create(favoriteData);
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Favorite | null> {
    return this.dao.findByUserAndProduct(userId, productId);
  }

  async findByUserId(userId: string): Promise<Favorite[]> {
    return this.dao.findByUserId(userId);
  }

  async deleteByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    return this.dao.deleteByUserAndProduct(userId, productId);
  }
}
```

### Por que lo hacemos

`Favorite` es una entidad puente entre usuario y producto.

No conviene meter un array de favoritos dentro de `users` en esta iteracion porque:

- complica actualizaciones concurrentes
- hace mas grande el documento de usuario
- vuelve menos clara la relacion muchos-a-muchos

### Concepto clave

El indice unico compuesto es lo que realmente evita duplicados en la base.

No alcanza solo con chequear en service.

---

### Paso 15 - Crear service y controller de favoritos

### Archivos

- `src/products/services/favorites.service.ts`
- `src/products/controllers/favorites.controller.ts`

### Snippet

```ts
// src/products/services/favorites.service.ts
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IFavoritesRepository } from '../repositories/favorites.repository';
import { FavoriteResponseDto } from '../dto/favorite-response.dto';
import { Favorite } from '../schemas/favorite.schema';
import { ProductsService } from './products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject('IFavoritesRepository')
    private readonly favoritesRepository: IFavoritesRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, productId: string): Promise<FavoriteResponseDto> {
    const existingFavorite = await this.favoritesRepository.findByUserAndProduct(
      userId,
      productId,
    );

    if (existingFavorite) {
      throw new ConflictException('Product already in favorites');
    }

    const product = await this.productsService.findActiveEntityOrThrow(productId);

    const favorite = await this.favoritesRepository.create({
      userId,
      productId,
    });

    return this.toFavoriteResponse(favorite, product);
  }

  async remove(userId: string, productId: string) {
    const deleted = await this.favoritesRepository.deleteByUserAndProduct(
      userId,
      productId,
    );

    return {
      deleted,
    };
  }

  async findMine(userId: string): Promise<FavoriteResponseDto[]> {
    const favorites = await this.favoritesRepository.findByUserId(userId);

    const responses = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const product = await this.productsService.findActiveEntityOrThrow(
            favorite.productId.toString(),
          );

          return this.toFavoriteResponse(favorite, product);
        } catch (error) {
          if (error instanceof NotFoundException) {
            return null;
          }

          throw error;
        }
      }),
    );

    return responses.filter(
      (favorite): favorite is FavoriteResponseDto => favorite !== null,
    );
  }

  private toFavoriteResponse(
    favorite: Favorite,
    product: {
      _id: { toString(): string };
      name: string;
      price: number;
      category: string;
      isActive: boolean;
    },
  ): FavoriteResponseDto {
    return {
      favoriteId: favorite._id.toString(),
      productId: favorite.productId.toString(),
      savedAt: favorite.createdAt,
      product: {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        category: product.category,
        isActive: product.isActive,
      },
    };
  }
}
```

```ts
// src/products/controllers/favorites.controller.ts
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { FavoritesService } from '../services/favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  async create(
    @Param('productId') productId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.favoritesService.create(req.user.userId, productId);
  }

  @Delete(':productId')
  async remove(
    @Param('productId') productId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.favoritesService.remove(req.user.userId, productId);
  }

  @Get('me')
  async findMine(@Request() req: { user: { userId: string } }) {
    return this.favoritesService.findMine(req.user.userId);
  }
}
```

### Por que lo hacemos

Favoritos es una feature personal del usuario, no del producto publico.

Por eso el entry point es `favorites/` y no `public/products/`.

### Concepto clave

Elegimos responder `409 Conflict` si el favorito ya existe.

Tambien podrias elegir idempotencia.

Lo importante es decidir una politica consistente y no generar duplicados.

---

### Paso 16 - Actualizar `ProductsModule` para favoritos

### Archivo a reemplazar

- `src/products/products.module.ts`

### Snippet

```ts
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { FavoritesController } from './controllers/favorites.controller';
import { ProductCommentsController } from './controllers/product-comments.controller';
import { ProductsController } from './controllers/products.controller';
import { PublicProductsController } from './controllers/public-products.controller';
import { FavoritesMongooseDao } from './dao/favorites.mongoose.dao';
import { ProductCommentsMongooseDao } from './dao/product-comments.mongoose.dao';
import { ProductsMongooseDao } from './dao/products.mongoose.dao';
import { FavoritesRepository } from './repositories/favorites.repository';
import { ProductCommentsRepository } from './repositories/product-comments.repository';
import { ProductsRepository } from './repositories/products.repository';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import {
  ProductComment,
  ProductCommentSchema,
} from './schemas/product-comment.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { FavoritesService } from './services/favorites.service';
import { ProductCommentsService } from './services/product-comments.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductComment.name, schema: ProductCommentSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [
    ProductsController,
    PublicProductsController,
    ProductCommentsController,
    FavoritesController,
  ],
  providers: [
    ProductsService,
    ProductCommentsService,
    FavoritesService,
    {
      provide: 'IProductsDao',
      useClass: ProductsMongooseDao,
    },
    {
      provide: 'IProductsRepository',
      useClass: ProductsRepository,
    },
    {
      provide: 'IProductCommentsDao',
      useClass: ProductCommentsMongooseDao,
    },
    {
      provide: 'IProductCommentsRepository',
      useClass: ProductCommentsRepository,
    },
    {
      provide: 'IFavoritesDao',
      useClass: FavoritesMongooseDao,
    },
    {
      provide: 'IFavoritesRepository',
      useClass: FavoritesRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Checkpoint funcional

Al cerrar este checkpoint deberia pasar esto:

1. Guardar favorito con `POST /favorites/:productId` (privado, requiere Bearer token)
2. Verlo en `GET /favorites/me` (privado, requiere Bearer token)
3. Intentar guardar el mismo producto de nuevo con `POST /favorites/:productId` (privado, requiere Bearer token) y recibir `409`
4. Quitar favorito con `DELETE /favorites/:productId` (privado, requiere Bearer token)

### Recordatorio para Postman o Thunder

- toda la feature de favoritos es privada
- en las tres requests hace falta `Authorization: Bearer <access_token>`

---

## Seccion 8 - Checkpoint 5: hardening, DX y calidad

Objetivo del checkpoint:

- bajar repeticion
- hacer mas clara la lectura del codigo
- dejar una base mas facil de testear

Este checkpoint no agrega una feature nueva para negocio, pero mejora la calidad del backend.

---

### Paso 17 - Crear un decorator `CurrentUser`

### Que hacemos

Sacamos el uso repetido de `@Request() req`.

### Archivos

- `src/common/decorators/current-user.decorator.ts`
- controllers de `products` y `favorites`

### Snippet

```ts
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUserPayload }>();
    return request.user;
  },
);
```

Uso sugerido:

```ts
@Post()
async create(
  @Body() createProductDto: CreateProductDto,
  @CurrentUser() user: JwtUserPayload,
) {
  return this.productsService.create(user.userId, createProductDto);
}
```

### Por que lo hacemos

No cambia el comportamiento, pero mejora mucho la legibilidad.

### Concepto clave

Hardening no siempre significa "mas seguridad".

Tambien significa hacer mas expresivo y mantenible el codigo.

---

### Paso 18 - Extraer helpers de mapeo y ownership

### Sugerencia

Si el service de productos empieza a crecer demasiado, conviene extraer:

- `product.mapper.ts`
- `assert-product-owner.ts`
- `base64-image.validator.ts`

### Por que lo hacemos

Es una buena oportunidad para explicar cuando un service ya esta cargando demasiadas responsabilidades.

### Aclaracion para reforzar

No extraemos helpers por deporte.

Los extraemos cuando:

- hay repeticion
- el service se hace largo
- una regla merece nombre propio

---

### Paso 19 - Completar tests del flujo

### Minimo recomendado

Unit tests:

- validar que `price <= 0` falle
- validar que una categoria invalida falle
- validar que `paymentOptions` vacio falle
- validar ownership en update y delete

E2E tests:

- crear producto con JWT
- verlo publicamente
- bloquear edicion ajena con `403`
- permitir comentarios solo con JWT
- evitar favoritos duplicados

### Snippet de idea para e2e

```ts
it('should block product update from another user', async () => {
  await request(app.getHttpServer())
    .patch(`/products/${productId}`)
    .set('Authorization', `Bearer ${otherUserToken}`)
    .send({ price: 999 })
    .expect(403);
});
```

### Por que lo hacemos

La mejor prueba de que el checkpoint esta bien cerrado es poder mostrarlo funcionando sin depender solo de Postman.

---

### Paso 20 - Documentar contratos y valores permitidos

### Archivos sugeridos

- `README.md`
- o una guia aparte de endpoints

### Minimo a documentar

- lista de categorias permitidas
- lista de opciones de pago permitidas
- ejemplo de body para crear producto
- ejemplo de body para comentar
- ejemplo de header `Authorization: Bearer <access_token>` para endpoints privados
- significado de `isActive`
- que endpoints son publicos y cuales requieren JWT

### Por que lo hacemos

Si el frontend o los alumnos no saben el contrato, el backend parece "romperse" cuando en realidad esta validando bien.

---

## Seccion 9 - Orden recomendado de trabajo en clase

1. Crear `ProductsModule` y registrarlo.
2. Hacer andar el primer `POST /products`.
3. Cerrar lectura publica antes de abrir update/delete.
4. Recien despues sumar ownership.
5. Luego comentarios.
6. Luego favoritos.
7. Al final, helpers y tests.

### Por que este orden ayuda

Porque prioriza vertical slices visibles:

- primero publico un producto
- despues lo administro
- despues interactuo
- despues personalizo favoritos

Eso mantiene motivacion y evita que los alumnos pasen una clase entera armando solo estructuras sin ver nada funcionar.

---

## Seccion 10 - Checklist final contra la spec

Si llegaste al final, deberias poder marcar esto:

- `Product.category` se valida con enum hardcodeado
- `Product.paymentOptions` se valida con enum hardcodeado
- `POST /products` requiere JWT y toma `ownerId` del token
- `price` se valida como mayor a cero
- `imagesBase64` viajan dentro del JSON
- `GET /public/products` muestra solo activos
- `GET /public/products/:id` devuelve owner publico
- `PATCH /products/:id` solo lo puede hacer el owner
- `DELETE /products/:id` hace baja logica
- `GET /products/mine` devuelve solo productos del usuario
- `POST /products/:id/comments` requiere JWT
- `GET /products/:id/comments` requiere JWT
- los comentarios no aparecen en endpoints publicos
- `POST /favorites/:productId` guarda un favorito sin duplicados
- `DELETE /favorites/:productId` lo quita
- `GET /favorites/me` devuelve solo favoritos del usuario autenticado

---

## Cierre

La idea de esta clase no es solo "sumar endpoints".

La idea es mostrar como una app que ya tenia auth puede crecer a un modulo de negocio real sin perder orden.

Si durante la clase necesitan recortar alcance, el mejor lugar para cortar sin romper la experiencia es este:

1. cerrar checkpoint 1 completo
2. cerrar checkpoint 2 completo
3. dejar comentarios y favoritos para la clase siguiente

Asi siempre quedan con una app funcionando y con una historia tecnica coherente.
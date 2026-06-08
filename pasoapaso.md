# De app CRUD simple a auth con JWT: guia paso a paso

## Como usar esta guia

Esta guia esta pensada como una presentacion por secciones para explicar, desde el ultimo commit estable (`f66105e`), como llegamos al estado actual de la app.

La idea no es solo mostrar "que codigo escribir", sino tambien:

- por que hacemos cada cambio
- que problema resuelve
- que buena practica estamos aplicando
- que errores comunes conviene evitar

Cada seccion sigue casi siempre esta estructura:

- `Que hacemos`
- `Por que lo hacemos`
- `Snippet`
- `Buenas practicas`
- `Error comun`

---

## Seccion 1 - Punto de partida real

### Que tenemos en el ultimo commit

Partimos de una app NestJS muy simple:

```text
src/
├── app.module.ts
├── main.ts
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── dto/
        ├── create_user.dto.ts
        └── schemas/
            └── user.schema.ts
```

Los endpoints disponibles eran:

- `POST /users/create`
- `GET /users`

### Snippet

```ts
// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/create')
  create(@Body() createUser: CreateUserDto) {
    return this.usersService.create(createUser);
  }

  @Get()
  getUsers() {
    return this.usersService.findAllUsers();
  }
}
```

### Por que este punto de partida es util

Porque ya resuelve algo concreto: recibir requests, validarlas con DTOs y guardar usuarios en MongoDB.

Eso esta bien para empezar, pero se queda corto cuando queremos:

- autenticar usuarios
- hashear passwords
- proteger rutas
- separar responsabilidades
- escalar el proyecto sin mezclar todo

### Buena practica

Siempre explicar primero que ya funciona antes de criticar la arquitectura. El objetivo no es "tirar abajo" lo anterior, sino mostrar por que necesitamos evolucionarlo.

### Aclaracion para reforzar

No estamos agregando autenticacion "porque si".

La app inicial permite crear y listar usuarios, pero no permite responder una pregunta clave:

- quien esta usando la app

La autenticacion aparece cuando necesitamos identificar al usuario antes de dejarlo acceder a ciertas rutas.

---

## Seccion 2 - Que problemas tiene la version inicial

### Problemas reales

1. El `service` habla directo con Mongoose.
2. No existe `password`, asi que no puede haber login.
3. No existe autenticacion ni autorizacion.
4. Si algo falla, se hace `console.log` y poco mas.
5. La salida del usuario no esta pensada para ocultar datos sensibles.
6. El modulo `users` tiene demasiadas responsabilidades juntas.

### Snippet

```ts
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const createdUser = new this.userModel(createUserDto);
      return createdUser.save();
    } catch (error) {
      console.log(error);
    }
  }
}
```

### Por que esto se vuelve un problema

En una app chica puede parecer suficiente.

Pero cuando agregamos autenticacion, reglas de negocio y seguridad, mezclar acceso a datos, logica de negocio y detalles de framework en el mismo lugar vuelve el codigo:

- mas dificil de leer
- mas dificil de testear
- mas fragil frente a cambios

### Buena practica

Cuando una app crece, no se mejora "agregando mas lineas en el mismo archivo". Se mejora separando responsabilidades.

---

## Seccion 3 - A donde queremos llegar

### Objetivo final de esta evolucion

Queremos pasar de un CRUD simple a un modulo de identidad mas serio:

- registro de usuario
- login
- password hasheado
- JWT
- rutas protegidas con guards
- arquitectura en capas

### Estructura objetivo

```text
src/users/
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

### Por que esta estructura es mejor

- `controller`: recibe requests y delega
- `service`: aplica reglas de negocio
- `repository`: abstrae persistencia
- `dao`: habla con Mongoose
- `strategy`: define como se valida un token
- `guard`: decide si una request entra o no

### Buena practica

No separar archivos "porque suena profesional". Separarlos cuando cada capa tiene una responsabilidad clara y reconocible.

### Aclaracion para reforzar

No estamos cambiando la estructura solo para que "se vea mas profesional".

La idea no es tener mas archivos, sino que cada archivo tenga una razon clara para existir.

Tambien conviene decir explicitamente que, si el proyecto fuera muy chico, algunas capas podrian parecer exageradas. El valor de esta clase esta en mostrar una arquitectura por capas entendible, no en decir que todo proyecto siempre necesita todas estas piezas.

---

## Seccion 4 - Paso 1: instalar dependencias de auth

### Que hacemos

Agregamos dependencias para:

- generar JWT
- leer JWT desde el header
- usar guards con Passport
- hashear passwords con bcrypt

### Snippet

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install -D @types/bcrypt @types/passport-jwt
```

### Por que lo hacemos

NestJS ya resuelve muy bien la parte de controllers y services, pero para auth conviene apoyarse en herramientas estandar:

- `@nestjs/jwt`: firma y verifica tokens
- `passport` + `@nestjs/passport`: integracion de autenticacion
- `passport-jwt`: strategy para tokens Bearer
- `bcrypt`: hash seguro de passwords

### Buenas practicas

- No inventar tu propio sistema de tokens.
- No guardar passwords en texto plano.
- No usar hashes rapidos tipo SHA-256 para passwords de usuario.

### Error comun

Pensar que "en desarrollo puedo guardar la password en claro y despues la arreglo". Ese tipo de decision casi siempre termina filtrandose a etapas mas avanzadas.

---

## Seccion 5 - Paso 2: preparar variables de entorno

### Que hacemos

Sacamos de codigo duro los datos sensibles o que cambian segun el entorno.

### Snippet

```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/proyecto-web-2?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=cambiar-por-un-secret-seguro
JWT_EXPIRATION=1h
PORT=3000
```

### Por que lo hacemos

Hay valores que no deben quedar hardcodeados:

- URL de base de datos
- secreto JWT
- expiracion del token
- puerto

Esto permite:

- cambiar configuracion sin tocar codigo
- tener distintos entornos
- evitar secretos expuestos en el repositorio

En nuestro caso, como estamos trabajando con MongoDB Atlas, tiene mas sentido mostrar una URI `mongodb+srv://...` que una URI local de `mongodb://localhost/...`.

### Buenas practicas

- Versionar `.env.example`, no el `.env` real.
- Usar nombres claros y consistentes.
- Tratar `JWT_SECRET` como dato sensible de verdad.

### Aclaracion para reforzar

No estamos commiteando secretos reales.

Lo correcto es:

- versionar `.env.example`
- dejar el `.env` real fuera del repositorio

Eso evita exponer credenciales o secretos por accidente.

### Error comun

Poner el secreto JWT directo dentro del `JwtModule.register({ secret: '1234' })`.

---

## Seccion 6 - Paso 3: configurar AppModule y ConfigModule

### Que hacemos

Hacemos que la app lea variables de entorno y conecte Mongo usando esa configuracion.

### Snippet

```ts
// src/app.module.ts
@Module({
  imports: [
    UsersModule,
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
})
export class AppModule {}
```

### Por que lo hacemos

`ConfigModule` le da a Nest una forma ordenada de leer configuracion.

`MongooseModule.forRootAsync(...)` sirve para construir la conexion usando dependencias del framework, en este caso `ConfigService`.

### Buenas practicas

- Preferir configuracion asincronica cuando depende de `ConfigService`.
- Usar `isGlobal: true` si realmente queres `ConfigService` disponible en toda la app.

### Aclaracion para reforzar

Usamos `ConfigModule` porque centraliza la lectura de configuracion.

Eso evita que cada archivo lea variables de entorno por su cuenta.

Tambien usamos `JwtModule.registerAsync(...)` porque el secreto y la expiracion vienen de configuracion. En vez de hardcodear esos valores, los obtenemos desde `ConfigService`.

### Error comun

Conectar Mongo con una URI escrita a mano dentro del modulo. Funciona, pero acopla el codigo a un entorno especifico.

---

## Seccion 7 - Paso 4: activar validacion global

### Que hacemos

Activamos `ValidationPipe` en `main.ts`.

### Snippet

```ts
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Por que lo hacemos

Esto hace que Nest valide automaticamente los DTOs antes de entrar al controller.

Cada opcion tiene un sentido:

- `whitelist: true`: elimina propiedades no definidas en el DTO
- `forbidNonWhitelisted: true`: ademas de eliminarlas, puede rechazar el request
- `transform: true`: transforma el body al tipo esperado

### Aclaracion para reforzar

No estamos validando todo manualmente con cosas como:

```ts
if (!body.email) {
  ...
}
```

Delegamos la validacion declarativa a DTOs + `ValidationPipe`.

Eso mejora:

- claridad
- reutilizacion
- consistencia entre endpoints

Y ademas protege la entrada real de la app:

- `whitelist` limpia campos inesperados
- `forbidNonWhitelisted` vuelve mas estricto el contrato
- `transform` ayuda a que el controller trabaje con objetos mas consistentes

### Buenas practicas

La validacion debe estar lo mas cerca posible de la entrada de la app. No conviene que cada controller "valide a mano".

### Error comun

Confiar en que "el frontend ya manda bien los datos". El backend siempre debe validar.

---

## Seccion 8 - Paso 5: evolucionar el schema de usuario

### Que hacemos

Agregamos al usuario los campos necesarios para autenticacion y manejo basico de estado.

### Snippet

```ts
// src/users/schemas/user.schema.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: true, unique: true })
  mail: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;
}
```

### Por que lo hacemos

Sin `password`, no existe login.

Sin `role`, no podemos empezar a pensar autorizacion.

Sin `isActive`, no tenemos una forma basica de desactivar usuarios sin borrarlos.

### Buenas practicas

- Marcar `mail` como `unique`.
- Guardar `role` con `enum`.
- Usar `timestamps` para auditoria basica.

### Aclaracion para reforzar

Agregar `role` no significa que ya tengamos autorizacion completa.

Lo que estamos implementando en esta clase es principalmente autenticacion:

- validar identidad con login + JWT

La autorizacion viene despues y responde otra pregunta:

- que puede hacer cada usuario

Por ejemplo, en una app real podriamos decidir que solo un admin puede listar todos los usuarios. Ese paso todavia no lo estamos implementando aqui.

### Error comun

Guardar la password "como vino" desde el cliente. El schema necesita el campo, pero el hash se hace en la capa de negocio, no en el schema.

---

## Seccion 9 - Paso 6: separar DTOs de entrada y salida

### Que hacemos

Dejamos de tener un solo DTO generico y creamos DTOs para cada caso de uso.

### Snippets

```ts
// src/users/dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  surname: string;

  @IsEmail()
  mail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/.../)
  password: string;
}
```

```ts
// src/users/dto/login-user.dto.ts
export class LoginUserDto {
  @IsEmail()
  mail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

```ts
// src/users/dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  name: string;
  surname: string;
  mail: string;
  role: string;

  @Exclude()
  password: string;
}
```

### Por que lo hacemos

No todos los flujos necesitan los mismos datos:

- registrar usuario: nombre, apellido, mail, password
- login: mail, password
- respuesta al cliente: nunca password

Separar DTOs hace que el contrato HTTP sea mas claro y mas seguro.

### Buenas practicas

- Un DTO por caso de uso importante.
- Validar fortaleza minima de password.
- Tener un DTO de salida cuando hay datos sensibles.

### Aclaracion para reforzar

El DTO de entrada no es el mismo que el DTO de salida.

- `CreateUserDto` acepta password
- `LoginUserDto` acepta mail y password
- `UserResponseDto` no deberia exponer password

Esto refuerza una idea importante: cada caso de uso tiene un contrato distinto.

Tambien es buena oportunidad para remarcar que no conviene devolver documentos crudos de Mongo "porque justo eso fue lo que devolvio la base". La salida de la API deberia ser una decision explicita.

### Error comun

Usar el mismo objeto para crear, loguear y responder al cliente.

---

## Seccion 10 - Paso 7: limpiar estructura vieja

### Que hacemos

Eliminamos archivos que quedaron obsoletos:

- `src/users/dto/create_user.dto.ts`
- `src/users/dto/schemas/user.schema.ts`
- `src/users/users.controller.ts`
- `src/users/users.service.ts`

Y movemos la logica a la nueva estructura por carpetas.

### Por que lo hacemos

Cuando convivien la version vieja y la nueva al mismo tiempo, aparecen varios problemas:

- imports ambiguos
- confusiones al explicar la clase
- riesgo de editar el archivo equivocado
- dificultad para mantener la app

### Buenas practicas

- Si haces una migracion de estructura, limpiala al final.
- Deja una sola fuente de verdad para cada concepto.

### Aclaracion para reforzar

No estamos borrando archivos por capricho.

Los borramos porque ya existe una nueva fuente de verdad. Mantener codigo muerto aumenta la confusion, facilita imports equivocados y vuelve mucho mas dificil explicar la clase.

### Error comun

Crear la carpeta nueva y dejar la vieja "por si acaso". Eso suele empeorar la base del proyecto.

---

## Seccion 11 - Paso 8: crear la capa DAO

### Que hacemos

Creamos una capa especifica que hable con Mongoose.

### Snippet

```ts
// src/users/dao/users.mongoose.dao.ts
export interface IUsersDao {
  create(userData: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, updateData: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class UsersMongooseDao implements IUsersDao {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }
}
```

### Por que lo hacemos

El DAO concentra el detalle tecnico de persistencia:

- queries
- modelos de Mongoose
- `findOne`, `findById`, `save`, `exec`

Eso evita que el `service` quede pegado a Mongoose.

### Buenas practicas

- El DAO sabe de base de datos.
- El DAO no deberia saber de JWT ni de reglas de negocio.
- Definir una interfaz mejora la intercambiabilidad.

### Aclaracion para reforzar

DAO y repository no se agregan porque siempre sean obligatorios.

En una app muy simple, `service + model` podria alcanzar.

En esta clase los agregamos porque sirven para explicar arquitectura en capas:

- DAO: acceso concreto a Mongoose
- repository: abstraccion para que el service no dependa directamente de la tecnologia de persistencia

### Error comun

Poner en el DAO decisiones de negocio como "si ya existe el mail lanzar tal regla". Eso corresponde al service.

---

## Seccion 12 - Paso 9: crear la capa Repository

### Que hacemos

Agregamos una capa intermedia entre `service` y `dao`.

### Snippet

```ts
// src/users/repositories/users.repository.ts
export interface IUsersRepository {
  create(userData: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, updateData: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @Inject('IUsersDao') private readonly dao: IUsersDao,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.dao.findByEmail(email);
  }
}
```

### Por que lo hacemos

Hoy parece que el repository solo delega. Y es verdad.

Pero esa capa existe para que el service dependa de una abstraccion y no de la implementacion concreta.

Mañana podriamos:

- agregar cache
- combinar varias fuentes de datos
- cambiar Mongo por otra tecnologia

sin romper la capa de negocio.

### Buenas practicas

- Explicar que una capa no solo existe por lo que hace hoy, sino por el punto de extension que habilita.

### Aclaracion para reforzar

Hoy el repository puede parecer que "solo delega", y eso esta bien para fines didacticos.

Su valor no siempre esta en transformar datos ahora mismo, sino en desacoplar.

Tambien hay que decirlo con honestidad: no conviene agregar capas sin criterio en cualquier proyecto.

### Error comun

Decir "esta capa no sirve porque solo pasa llamadas". En arquitectura, a veces el valor esta en desacoplar, no en transformar datos.

---

## Seccion 13 - Paso 10: refactorizar UsersService

### Que hacemos

El `UsersService` deja de hablar con Mongoose y pasa a depender del repository.

### Snippet

```ts
// src/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.create(createUserDto);
      return plainToClass(UserResponseDto, user.toObject());
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Could not create user');
    }
  }
}
```

### Por que lo hacemos

Ahora el service queda enfocado en:

- reglas de negocio
- manejo de errores del dominio
- transformacion de salida

Ya no se ocupa de detalles de Mongoose.

### Buenas practicas

- Traducir errores tecnicos a errores HTTP comprensibles.
- No devolver `null` silenciosamente cuando algo falla.
- No exponer el documento crudo de Mongo si no hace falta.

### Aclaracion para reforzar

El `service` no es "otro archivo mas".

Es el lugar donde concentramos reglas de negocio.

En este proyecto:

- `AuthService` entiende de registro, login, validacion de credenciales y generacion de token
- `UsersService` entiende de operaciones sobre usuarios

Esa separacion evita mezclar autenticacion con administracion de usuarios.

### Error comun

Atrapar el error y hacer solo `console.log`. Eso oculta el problema y hace mas dificil depurarlo desde el cliente.

---

## Seccion 14 - Paso 11: crear AuthService

### Que hacemos

Centralizamos en un servicio la logica de autenticacion:

- validar credenciales
- registrar usuario
- hashear password
- generar JWT

### Snippet

```ts
// src/users/services/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.mail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }
}
```

### Por que lo hacemos

La autenticacion no es lo mismo que la administracion de usuarios.

`UsersService` responde cosas como:

- buscar usuarios
- actualizarlos
- borrarlos

`AuthService` responde cosas como:

- como se registra un usuario
- como se valida un password
- como se genera un token

### Buenas practicas

- Hashear en el service, no en el controller.
- Comparar con `bcrypt.compare`, nunca con igualdad directa.
- Generar el token solo despues de validar credenciales.

### Aclaracion para reforzar

No hace falta meterse en criptografia profunda para esta clase.

Alcanza con entender la idea practica:

1. la password real entra una vez
2. antes de guardar, se convierte en hash
3. luego, en login, se compara la password ingresada contra ese hash

Lo importante es entender por que usamos `bcrypt`:

- en registro guardamos un hash
- en login no guardamos nada nuevo
- usamos `bcrypt.compare(...)` para comparar password contra hash

### Error comun

Hashear tambien en login. En login no se hashea el password para guardar, se compara contra el hash existente.

---

## Seccion 15 - Paso 12: generar JWT en login

### Que hacemos

Cuando el login es valido, devolvemos un token firmado.

### Snippet

```ts
async login(loginUserDto: LoginUserDto) {
  const user = await this.validateUser(
    loginUserDto.mail,
    loginUserDto.password,
  );

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = {
    sub: user._id.toString(),
    email: user.mail,
    role: user.role,
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user._id.toString(),
      name: user.name,
      surname: user.surname,
      email: user.mail,
      role: user.role,
    },
  };
}
```

### Por que lo hacemos

El JWT es una credencial firmada que luego el cliente envia en cada request protegida.

El payload incluye informacion minima y util:

- `sub`: identificador del usuario
- `email`
- `role`

### Buenas practicas

- Mantener el payload chico.
- No meter datos sensibles innecesarios dentro del token.
- Usar `sub` para el id del usuario es una convencion muy comun.

### Aclaracion para reforzar

Hay varias ideas importantes para marcar aca:

- el JWT no guarda una sesion tradicional en el backend
- el servidor firma un token y el cliente lo envia en cada request
- el backend valida firma y expiracion

Tambien es clave remarcar esto:

- el token esta firmado, no necesariamente encriptado

Eso significa que su contenido puede leerse. Por eso no se debe poner informacion sensible dentro del payload.

### Error comun

Poner la password, datos enormes o informacion sensible extra en el payload del JWT.

---

## Seccion 16 - Paso 13: crear JwtStrategy

### Que hacemos

Definimos como se valida un token JWT entrante.

### Snippet

```ts
// src/users/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Por que lo hacemos

La strategy le dice a Passport:

- de donde sacar el token
- con que secreto verificarlo
- que informacion dejar en `req.user`

Sin strategy, el guard no sabria como autenticar.

### Buenas practicas

- Leer el secreto desde configuracion.
- Devolver en `validate()` solo lo necesario para la request actual.
- Dejar el nombre del archivo alineado con su responsabilidad: `jwt.strategy.ts`.

### Aclaracion para reforzar

`req.user` no aparece por arte de magia.

Lo que devuelve `JwtStrategy.validate()` queda disponible en la request.

Por eso conviene decidir bien que informacion devolver ahi.

### Error comun

Confundir strategy con guard.

- `strategy`: define como se autentica
- `guard`: decide si la ruta permite o no seguir

---

## Seccion 17 - Paso 14: crear JwtAuthGuard

### Que hacemos

Creamos un guard basado en Passport que use la strategy `jwt`.

### Snippet

```ts
// src/users/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Por que lo hacemos

El guard intercepta la request antes de entrar al controller.

Si el token:

- no existe
- esta vencido
- esta mal firmado

la request no entra.

### Buenas practicas

- Mantener el guard chiquito cuando no hace falta personalizarlo.
- Apoyarse en `AuthGuard('jwt')` en lugar de reimplementar la rueda.

### Error comun

Pensar que el guard genera el token. No: el guard solo valida si la request ya trae una credencial valida.

### Aclaracion para reforzar

Esta diferencia suele confundir al principio:

- la strategy define como validar el token
- el guard decide si la request puede continuar

El token se genera durante el login. El guard no genera tokens.

---

## Seccion 18 - Paso 15: proteger rutas con el guard

### Que hacemos

Usamos `@UseGuards(JwtAuthGuard)` en rutas que no deben ser publicas.

### Snippets

```ts
// src/users/controllers/users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get()
  async getUsers() {
    return this.usersService.findAllUsers();
  }
}
```

```ts
// src/users/controllers/auth.controller.ts
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req: { user: { userId: string } }) {
  return this.authService.getProfile(req.user.userId);
}
```

### Por que lo hacemos

No todas las rutas deben ser publicas.

Tiene sentido que `register` y `login` no requieran token.

En cambio:

- ver perfil
- listar usuarios
- consultar un usuario
- actualizar
- borrar

si deben quedar protegidos.

### Buenas practicas

- Hacer explicito que rutas son publicas y cuales privadas.
- Proteger a nivel de controller cuando casi todas las rutas comparten la misma regla.

### Aclaracion para reforzar

No todas las rutas deberian ser publicas.

- `register` y `login` son publicas porque el usuario todavia no tiene token
- `profile`, `users`, `update` y `delete` deberian requerir autenticacion

Eso no significa que ya estemos resolviendo permisos finos.

Aunque `GET /users` este protegido, en una app real probablemente solo deberia verlo un admin. Para esta clase alcanza con mostrar proteccion por autenticacion.

### Error comun

Proteger solo algunas rutas por descuido y dejar otras sensibles expuestas.

---

## Seccion 19 - Paso 16: crear AuthController y separar responsabilidades HTTP

### Que hacemos

Separamos los endpoints de autenticacion del CRUD de usuarios.

### Snippet

```ts
// src/users/controllers/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
}
```

### Por que lo hacemos

Aunque `auth` y `users` pertenezcan al mismo dominio, sus endpoints representan intenciones distintas:

- `users`: administrar usuarios
- `auth`: registrar, loguear, validar identidad

Eso mejora la semantica de la API y la claridad de la clase.

### Buenas practicas

- Nombrar rutas segun la intencion, no segun la implementacion interna.
- `POST /auth/login` comunica mucho mejor que "endpoint raro dentro de users".

### Aclaracion para reforzar

El controller no es el lugar para la logica de negocio.

El controller:

- recibe la request
- se apoya en DTOs y pipes para validar entrada
- delega al service

No deberia:

- hashear passwords
- consultar Mongo directamente
- decidir reglas complejas de negocio

### Error comun

Meter login dentro de `users.controller.ts` por comodidad y terminar con un controller sin cohesion.

### Prueba en Postman - `POST /auth/register`

Una vez que ya tenemos `AuthController` + `AuthService` para registro, podemos probar este flujo en Postman.

```text
Method: POST
URL: http://localhost:3000/auth/register
Headers:
  Content-Type: application/json
Body (raw / JSON):
{
  "name": "Ana",
  "surname": "Lopez",
  "mail": "ana.lopez@example.com",
  "password": "ClaveSegura1!"
}
```

### Que deberiamos ver

- si sale bien: un usuario creado sin exponer password
- si el mail ya existe: `409 Conflict`
- si el body no cumple el DTO: `400 Bad Request`

### Que esta pasando por detras

- Postman envia JSON al endpoint
- Nest valida con `CreateUserDto`
- `AuthController` delega en `AuthService`
- `AuthService` revisa si el mail existe
- si no existe, hashea password
- luego se crea el usuario en Mongo

### Prueba en Postman - `POST /auth/login`

Despues del registro, podemos probar login con el mismo usuario.

```text
Method: POST
URL: http://localhost:3000/auth/login
Headers:
  Content-Type: application/json
Body (raw / JSON):
{
  "mail": "ana.lopez@example.com",
  "password": "ClaveSegura1!"
}
```

### Que deberiamos ver

- si sale bien: un `access_token` y datos del usuario
- si las credenciales fallan: `401 Unauthorized`

### Sugerencia practica para Postman

Copiar el valor de `access_token`, porque lo vamos a usar en los endpoints protegidos siguientes.

---

## Seccion 20 - Paso 17: registrar todo en UsersModule

### Que hacemos

Conectamos controllers, services, providers custom, JWT y strategy dentro del modulo.

### Snippet

```ts
// src/users/users.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    {
      provide: 'IUsersDao',
      useClass: UsersMongooseDao,
    },
    {
      provide: 'IUsersRepository',
      useClass: UsersRepository,
    },
  ],
})
export class UsersModule {}
```

### Por que lo hacemos

El modulo es donde Nest entiende:

- que clases existen
- cuales son controllers
- cuales son providers
- que implementacion concreta debe inyectar para cada token

### Buenas practicas

- Inyectar por abstraccion (`IUsersDao`, `IUsersRepository`) cuando queremos desacoplar capas.
- Configurar `JwtModule` en el modulo del dominio que lo necesita.

### Error comun

Olvidar registrar `JwtStrategy` en `providers`. Si eso pasa, el guard existe, pero Passport no sabe como validar el token.

---

## Seccion 21 - Paso 18: que cambia en los endpoints

### Antes

- `POST /users/create`
- `GET /users`

### Ahora

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile` protegido con JWT
- `POST /users` protegido con JWT
- `GET /users` protegido con JWT
- `GET /users/:id` protegido con JWT
- `PUT /users/:id` protegido con JWT
- `DELETE /users/:id` protegido con JWT

### Por que este cambio es importante

La API deja de ser solo un CRUD simple y pasa a modelar mejor el dominio:

- registro
- autenticacion
- acceso protegido
- operaciones administrativas

### Buena practica

Mostrar siempre el "antes" y el "despues" de las rutas. A quienes aprenden backend les ayuda mucho a conectar arquitectura con experiencia de consumo real.

### Pruebas en Postman - endpoints protegidos

Una vez que ya tenemos login y guard funcionando, conviene probar al menos dos rutas protegidas:

#### `GET /auth/profile`

```text
Method: GET
URL: http://localhost:3000/auth/profile
Headers:
  Authorization: Bearer <access_token>
```

#### `GET /users`

```text
Method: GET
URL: http://localhost:3000/users
Headers:
  Authorization: Bearer <access_token>
```

### Que deberiamos ver

- sin token: `401 Unauthorized`
- con token valido: la request entra
- en `profile`: datos del usuario autenticado
- en `users`: listado de usuarios

### Sugerencia practica para Postman

Conviene crear una variable de coleccion o de entorno:

```text
access_token = <token devuelto por /auth/login>
```

Y despues usar:

```text
Authorization: Bearer {{access_token}}
```

---

## Seccion 22 - Flujo completo de register

### Paso a paso

1. El cliente llama `POST /auth/register`.
2. Nest valida el body con `CreateUserDto`.
3. `AuthController` delega en `AuthService`.
4. `AuthService` verifica si el mail ya existe.
5. Si existe, lanza `409 Conflict`.
6. Si no existe, hashea la password con `bcrypt`.
7. Llama a `UsersService.create(...)`.
8. `UsersService` delega en repository.
9. Repository delega en DAO.
10. DAO guarda en MongoDB.
11. La respuesta vuelve sin exponer password.

### Que es importante remarcar

El hash no se hace en el controller ni en la base de datos.

Se hace en el `AuthService` porque es una regla de seguridad y de negocio.

Tambien es importante remarcar por que capturamos el email duplicado como `409 Conflict`:

- el mail es unico
- no corresponde responderlo como error generico del servidor

---

## Seccion 23 - Flujo completo de login y acceso a una ruta protegida

### Login

1. Cliente llama `POST /auth/login`.
2. Nest valida `LoginUserDto`.
3. `AuthService.validateUser(...)` busca el usuario por mail.
4. Compara password plana contra hash con `bcrypt.compare(...)`.
5. Si es valido, genera JWT.
6. Devuelve `access_token`.

### Ruta protegida

1. Cliente llama `GET /auth/profile`.
2. Envia header `Authorization: Bearer <token>`.
3. `JwtAuthGuard` intercepta la request.
4. `JwtStrategy` extrae y valida el token.
5. Si es valido, carga datos en `req.user`.
6. El controller usa `req.user.userId`.

### Buena practica

Explicar el flujo completo ayuda a que guards y strategies dejen de parecer "magia del framework".

### Aclaracion para reforzar

En login conviene devolver un mensaje generico como `Invalid credentials`.

No suele convenir responder cosas como:

- "el email no existe"
- "la password es incorrecta"

porque eso da informacion innecesaria sobre usuarios registrados.

---

## Seccion 24 - Buenas practicas que estamos aplicando

### Seguridad

- Passwords hasheadas con `bcrypt`
- JWT con secreto configurable
- Rutas sensibles protegidas con guard
- DTO de salida para no exponer password

### Arquitectura

- Separacion por capas
- Inyeccion por abstracciones
- Controllers finos
- Services con logica de negocio
- DAO enfocado en persistencia

### Mantenibilidad

- Estructura de carpetas clara
- Limpieza de archivos viejos
- Validacion centralizada
- Errores HTTP expresivos

---

## Seccion 25 - Errores comunes a evitar

### Seguridad

- Guardar passwords en texto plano
- Poner secretos dentro del codigo
- Exponer datos sensibles en respuestas o tokens

### Arquitectura

- Mezclar logica de negocio con queries
- Hacer controllers demasiado inteligentes
- Dejar archivos viejos conviviendo con nuevos

### Calidad

- Atrapar errores y devolver `null`
- No validar el input
- No explicar por que se creo cada capa

---

## Seccion 26 - Resultado final

### Lo que ganamos con esta evolucion

Pasamos de una app que solo guardaba usuarios a una base backend mucho mas cercana a una app real:

- identidad de usuario
- login
- JWT
- proteccion de rutas
- organizacion escalable

### Lo mas importante para transmitir en clase

No hicimos estos cambios "porque Nest lo recomienda" o "porque queda mas lindo".

Los hicimos porque cada uno resuelve un problema real:

- seguridad
- claridad
- escalabilidad
- mantenibilidad

---

## Seccion 27 - Cierre didactico

### Idea fuerza para cerrar la clase

La arquitectura no es decorar el proyecto con carpetas.

La arquitectura es tomar decisiones que hagan que:

- el codigo se entienda mejor
- los errores se manejen mejor
- los cambios futuros sean menos costosos
- la seguridad no dependa de la memoria del programador

### Frase final sugerida

"No estamos agregando complejidad porque si. Estamos organizando la complejidad que aparece cuando una app deja de ser un ejemplo minimo y empieza a parecerse a un sistema real."

---

## Seccion 28 - Aclaraciones para reforzar al final

### Autenticacion vs autorizacion

- autenticacion: "se quien sos"
- autorizacion: "se que podes hacer"

En esta clase resolvemos principalmente autenticacion con login + JWT.

Todavia no estamos implementando permisos por rol de forma completa.

### Que NO estamos implementando todavia

- refresh tokens
- logout real del lado servidor
- permisos finos por rol
- una solucion final de produccion

Con JWT stateless, el logout suele hacerse borrando el token del cliente. Si quisieramos invalidarlo antes de que expire, necesitariamos otro mecanismo como blacklist o sesiones persistidas.

### Alcance real de la clase

Estamos construyendo una base razonable para explicar:

- auth
- JWT
- guards
- DTOs
- capas

Una app productiva podria sumar:

- refresh tokens
- rate limiting
- auditoria
- monitoreo
- tests mas completos

### Idea docente central

La idea no es copiar carpetas.

La idea es entender:

- por que cada pieza existe
- que problema resuelve
- que responsabilidad tiene
- que problema aparece si la mezclamos con otra capa

---

## Seccion 29 - Recapitulacion final de flujos completos

### Flujo 1 - Registro

#### Que manda el cliente

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Ana",
  "surname": "Lopez",
  "mail": "ana.lopez@example.com",
  "password": "ClaveSegura1!"
}
```

#### Que pasa por detras

1. `ValidationPipe` valida el body con `CreateUserDto`
2. `AuthController` recibe la request
3. `AuthService` chequea si el mail ya existe
4. si no existe, hashea la password con `bcrypt`
5. `UsersService` delega en repository
6. repository delega en DAO
7. DAO guarda en MongoDB
8. la API responde sin password

### Flujo 2 - Login

#### Que manda el cliente

```http
POST /auth/login
Content-Type: application/json

{
  "mail": "ana.lopez@example.com",
  "password": "ClaveSegura1!"
}
```

#### Que pasa por detras

1. `ValidationPipe` valida el body con `LoginUserDto`
2. `AuthController` delega en `AuthService`
3. `AuthService` busca el usuario por mail
4. compara password ingresada contra hash con `bcrypt.compare(...)`
5. si coincide, genera un JWT
6. responde `access_token` + datos del usuario

### Flujo 3 - Ver perfil autenticado

#### Que manda el cliente

```http
GET /auth/profile
Authorization: Bearer <access_token>
```

#### Que pasa por detras

1. `JwtAuthGuard` intercepta la request
2. usa la `JwtStrategy`
3. la strategy extrae el token del header
4. valida firma y expiracion con `JWT_SECRET`
5. si el token es valido, deja datos en `req.user`
6. `AuthController` usa `req.user.userId`
7. `AuthService` busca el perfil y responde

### Flujo 4 - Pedir lista de usuarios

#### Que manda el cliente

```http
GET /users
Authorization: Bearer <access_token>
```

#### Que pasa por detras

1. entra el guard JWT
2. la strategy valida identidad
3. el controller deja pasar al `UsersService`
4. `UsersService` consulta via repository
5. repository consulta via DAO
6. DAO lee MongoDB
7. la API responde una lista de usuarios transformada para no exponer password

### Idea de cierre

Desde Postman nosotros vemos requests y responses.

Pero por detras ya hay varias piezas colaborando:

- DTOs y `ValidationPipe`
- controllers
- services
- repository
- DAO
- guard
- strategy
- JWT
- MongoDB

Eso es justamente lo que queriamos construir: no solo endpoints que funcionen, sino un flujo entendible, seguro y con responsabilidades bien separadas.

---

## Anexo - Orden sugerido para mostrar snippets en clase

Si queres dar esta clase con ritmo progresivo, este orden funciona bien:

1. Estado inicial: controller, service y schema viejos
2. Problemas del estado inicial
3. Dependencias nuevas
4. `.env.example`
5. `app.module.ts`
6. `main.ts`
7. `user.schema.ts`
8. `create-user.dto.ts`
9. `login-user.dto.ts`
10. `user-response.dto.ts`
11. `users.mongoose.dao.ts`
12. `users.repository.ts`
13. `users.service.ts`
14. `auth.service.ts`
15. `jwt.strategy.ts`
16. `jwt-auth.guard.ts`
17. `auth.controller.ts`
18. `users.controller.ts`
19. `users.module.ts`
20. Flujo final register/login/profile
import 'reflect-metadata'
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { createConnection } from "typeorm";
import { loadPolices } from "./utils/loadPolicies";

async function bootstrap() {

  // Create a new instance of connection to the database
  await createConnection();

  await loadPolices()

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();

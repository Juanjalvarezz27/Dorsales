import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Agregamos || "" para asegurar que siempre sea un string
    url: process.env["DATABASE_URL"] || "", 
  },
});
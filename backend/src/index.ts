import "dotenv/config";
import { createApp } from "./app.js";
import { seedContentDefaults } from "./lib/seedContent.js";

const port = Number(process.env.PORT ?? 4000);

seedContentDefaults()
  .catch((err) => {
    console.error("Falha ao semear valores padrão:", err);
  })
  .finally(() => {
    createApp().listen(port, () => {
      console.log(`API rodando em http://localhost:${port}`);
    });
  });

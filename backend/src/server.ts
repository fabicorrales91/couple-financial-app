import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`App Financiera backend escuchando en el puerto ${env.port}`);
});

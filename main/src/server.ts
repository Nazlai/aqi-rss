import { bootstrap } from "./app";

bootstrap().then(({ app, config }) => {
  app.listen(config.PORT);
});

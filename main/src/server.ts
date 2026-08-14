import { bootstrap } from "./app";

bootstrap().then(({ app, config, job }) => {
  app.listen(config.PORT);
  job.start();
});

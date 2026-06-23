## Quick Start

- make sure you have docker on your machine
- create an account at [Ministry of Environment](https://data.moenv.gov.tw/paradigm) for your api key
- create a .env file in `main` directory root

```
API_KEY="YOUR KEY"
API_ENDPOINT="MOE AQI ENDPOINT"
REDIS_CONNECTION="YOUR REDIS CONNECTION STRING"
```

execute this command to start dockerized express app and redis image

```
make up
```

and this command to stop docker container

```
make down
```

## Folder structure

- directory name serves as module name
- a module is separated into controller and service files
- a directory holds relevant utility files like types, enums and constants
- controller file holds http related logic
- service file holds business logic
- test related files (tests, mocks, msw handlers) are organized in the \_\_test\_\_ directory

```
src
├── aqi
│   ├── __test__
│   │   ├── aqi.controller.spec.ts
│   │   ├── aqi.service.spec.ts
│   │   └── mock
│   │       ├── aqi.mock.expected.json
│   │       ├── aqi.mock.json
│   │       ├── handlers.ts
│   │       ├── hourlyaqi.mock.expected.json
│   │       └── hourlyaqi.mock.json
│   ├── aqi.controller.ts
│   ├── aqi.error.ts
│   ├── aqi.router.ts
│   ├── aqi.service.ts
│   ├── constant.ts
│   ├── enum.ts
│   └── types.ts
```

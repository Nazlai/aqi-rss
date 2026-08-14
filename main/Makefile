COMPOSE        := docker compose
OVERRIDE_FILE  := compose.override.yaml
DEV_FILE       := compose.dev.yaml
PROD_FILES     := ${DEV_FILE} -f compose.prod.yaml -f compose.prod.local.yaml

.PHONY: up up-prod build-dev down ps logs

up: 
	DEBUG=true ${COMPOSE} -f ${DEV_FILE} -f ${OVERRIDE_FILE} up -d


up-prod:
	${COMPOSE} -f ${PROD_FILES} up --build -d


build-dev:
	${COMPOSE} -f ${DEV_FILE} build --no-cache


down:
	${COMPOSE} -f ${DEV_FILE} down


ps:
	${COMPOSE} -f ${DEV_FILE} ps 


logs:
	${COMPOSE} -f ${DEV_FILE} logs

    
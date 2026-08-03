up: 
	DEBUG=true docker compose -f compose.dev.yaml up -d


up-prod:
	docker-compose -f compose.dev.yaml -f compose.prod.yaml -f compose.prod.local.yaml up --build -d


build-dev:
	docker compose -f compose.dev.yaml build --no-cache


down:
	docker compose -f compose.dev.yaml down

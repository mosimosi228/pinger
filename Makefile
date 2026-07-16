.DEFAULT_GOAL := help

.PHONY: help config build run init test sqlc sqlc-clean sqlc-diff sqlc-dev sqlc-check web web-install

help: ## List commands
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-34s\033[0m %s\n", "make "$$1, $$2}' $(MAKEFILE_LIST)

config: ## Copy pinger.yaml.dist → pinger.yaml
	cp pinger.yaml.dist pinger.yaml
	@echo "✓ pinger.yaml created"

web-install: ## Install SPA npm dependencies
	cd web && npm install

web: ## Build SPA → internal/webui/dist/
	@mkdir -p internal/webui/dist public
	cd web && npm run build
	@rm -rf public/assets public/index.html public/widget.js
	@cp -a internal/webui/dist/. public/

build: ## Build binary → bin/pinger
	@mkdir -p bin runtime
	go build -o ./bin/pinger ./cmd/pinger

run: web build ## Build SPA + server and run
	./bin/pinger serve --config pinger.yaml

init: config web-install web build ## Config, SPA, runtime, and binary
	@mkdir -p runtime
	@echo "✓ init complete — run: make run"

test: ## Run tests
	@go test $$(go list -f '{{if .TestGoFiles}}{{.ImportPath}}{{end}}' ./internal/... ./pkg/... ./config/...)

sqlc: ## SQLC: generate code
	@echo "Generating sqlc generate..."
	rm -rf ./internal/infra/db/maps >/dev/null 2>&1
	@sqlc generate -f sqlc.yaml

sqlc-clean: ## SQLC: clean generated code
	@echo " Cleaning sqlc generated files..."
	@rm -rf internal/infra/db/maps/*.go

sqlc-diff: ## SQLC: show diff after generation
	@echo " Diff sqlc changes..."
	@sqlc generate -f sqlc.yaml --dry-run

sqlc-dev: sqlc ## SQLC: generate + go mod tidy
	@echo "sqlc generated + go mod tidy"
	@go mod tidy

sqlc-check: sqlc-clean sqlc ## SQLC: pre-commit check
	@echo "sqlc passed all checks"

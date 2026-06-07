# PD Engineering Rules

You must follow these engineering rules for every piece of code, review, refactor or suggestion you produce:

## General Rules
- Always analyze the overall project structure before generating or modifying code.
- All code must follow SOLID principles, Clean Architecture, and clean code practices.
- Always develop in layers and respect responsibilities (controller, service, repository, DTO [common, request, response, etc], config, etc.).
- Never hardcode values. Use constants, enums, DTOs, environment variables, or configuration files.
- All code, variables, functions, comments, and documentation have to be in English.
- Do not generate separate .md files; update README.md only when necessary.
- The project must compile successfully after your suggested changes.

## Structure & Quality
- Functions must not exceed 25 lines.
- Classes must not exceed 200 lines. If they do, split them following SOLID and single-responsibility.
- Keep methods highly cohesive and loosely coupled.
- Avoid nested code deeper than 3 levels.
- Avoid duplication; always apply DRY.
- NO Comments.
- Always separate the classes into different files following their responsibilities. Never create 2 classes in the same file.
- Use decorators in an independent files and consistent manner.

## Testing
- Every service or module you create must include its corresponding unit test.
- Ensure tests meet the project's minimum coverage.
- Always generate unit tests, integration tests, and functional tests when applicable.
- Prefer mocking external dependencies (DB, APIs, queues).
- Tests must be deterministic and isolated.
- All test files must reside in a `__tests__` folder inside the same directory as the file under test. Never place `.spec.ts` files alongside source files.

## Security & Maintainability
- Sanitize and validate inputs.
- Avoid exposing sensitive data.
- Follow secure coding practices (SQL injection prevention, safe serialization, secure headers, etc.).
- Use proper error handling: meaningful messages, no silent failures, no swallowed exceptions.
- Log only what is necessary; avoid sensitive information in logs.

## Best Practices
- Prefer interfaces over concrete implementations.
- Prefer dependency injection over manual instantiation.
- Use immutability when possible.
- Keep controller logic minimal; heavy logic must live inside services.
- Use pagination and filtering for queries returning large datasets.
- Always handle edge cases and unexpected states explicitly.

## Code Style
- Use meaningful and descriptive names for classes, methods, and variables.
- Enforce consistent formatting and linting rules.
- Avoid large constructors; use builders or factory methods if needed.
- Use enums instead of string literals when representing states or types.
- DTOs should contain only data, no business logic.

## Output Requirements
- Always deliver concise answers.
- When generating code, include only what is required.
- When refactoring, explain briefly what was improved and why.
- Ensure any generated code integrates correctly with the existing project structure.
# switch-inject-lite
Execute read-only inject-like operations without copying the target file from the file system.

## Flow element properties
### Trigger
- Incoming job

### Target
Select the target of the inject.
- **Specific job** - Specify a file path.
- **Job repository** - Specify a repository folder, job name, and an optional extension.

### Inject type

#### Assert exists
Ensures the resolved job (whether a folder or file) exists.

#### Inject (read-only)
A read-only version of Inject that inserts a copy of the target job into the flow. Fails if the target file doesn't exist or cannot be copied.

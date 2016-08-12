# switch-inject-lite
Execute read-only inject-like operations without copying the target file from the file system.

## Flow element properties
### Trigger
- Incoming job

### Target
- **Specific job** - Specify a file path.
- **Job repository** - Specify a repository folder, job name, and an optional extension.

### Inject type

#### Assert exists
Ensures the resolved job (whether a folder or file) exists.

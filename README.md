# switch-inject-lite
The purpose of this script is to provide a low-risk and contextual alternative to the Inject configurator.

While the stock Inject configurator is extremely powerful, for many operations, it poses a significant risk. The ability to copy and **remove** a remote file (which may be a variable) is extremely dangerous. The target variable could resolve incorrectly causing the destruction of Switch's own backing files, or other sensative files. In some cases, users have reported using the "Job repository" method of Inject, where "Job name" property resolves to null, which results in the entire repository being injected (and removed). 

The stock Inject configurator assumes that target jobs exist. If you aren't sure where the target job is, you have to send your incoming job into several incoming jobs, expecting all but one to fail. This results in routing out these non-failures from problem jobs, which is undesirable.

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

### Formats

** American formats are forbidden **
Always use swiss standard date and time formats.
Always use metric.

### netlify functions

the files in netlify/functions do not contain business logic, but are here to forward to the correct files in lib/.


### File hygiene

Do not create big files. Do not write spaghetti code. 

Database updates must be explicit, every sql generated defines its columns in code. 
Code like `UPDATE users SET ${fields.join(', ')}` is strictly forbidden.

#!/bin/sh
set -e

DB_FILE="${DATABASE_PATH:-/app/olympiad_linux.db}"
mkdir -p "$(dirname "$DB_FILE")"

python init_db.py

exec python -c "
from olympiad import create_app
import os
app = create_app()
app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '5001')), debug=False)
"

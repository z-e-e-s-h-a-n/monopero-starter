#!/bin/bash

# Get the name (e.g., "auth") from the argument
NAME=$1

if [ -z "$NAME" ]; then
  echo "❌ Please provide a name (e.g., ./generate.sh auth)"
  exit 1
fi

# Run NestJS CLI commands
nest g module $NAME
nest g service $NAME
nest g controller $NAME

cd $(dirname $0)

docker run --name local-pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -v "$(pwd)/init:/docker-entrypoint-initdb.d" \
  -d docker.io/library/postgres:17
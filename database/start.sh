cd $(dirname $0)

if [ "$(docker ps -aq -f name=^local-pg$)" = "" ]; then
  docker run --name local-pg \
    -e POSTGRES_PASSWORD=postgres \
    -p 5432:5432 \
    -v pgdata:/var/lib/postgresql/data \
    -d docker.io/library/postgres:17
else
  docker start local-pg
fi

until docker exec local-pg pg_isready -U postgres > /dev/null 2>&1; do
  sleep 0.5
done

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" node "$(pwd)/migrate.mjs"

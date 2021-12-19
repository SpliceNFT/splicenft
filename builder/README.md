docker build --no-cache --tag elmariachi/node16-pnpm:v1.6 builder
docker run -it --rm elmariachi/node16-pnpm:v1.6 bash
docker push elmariachi/node16-pnpm:v1.6

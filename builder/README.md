docker build --no-cache --tag elmariachi/node16-pnpm:v1.7 builder
docker run -it --rm elmariachi/node16-pnpm:v1.7 bash
docker push elmariachi/node16-pnpm:v1.7

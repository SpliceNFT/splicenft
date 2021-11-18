docker build --tag elmariachi/node16-pnpm:v1.4 builder
docker run -it --rm elmariachi/node16-pnpm:v1.4 bash
docker push elmariachi/node16-pnpm:v1.4

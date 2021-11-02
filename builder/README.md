docker build --tag elmariachi/node16-pnpm:v1.3 builder
docker run -it --rm elmariachi/node16-pnpm:v1.3 bash
docker push elmariachi/node16-pnpm:v1.3

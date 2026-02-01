FROM node:lts-slim

RUN apt-get update && apt-get install -y \
    git \
    make \
    python3 \
    zip \
    jq \
    openssl \
    xxd

WORKDIR /build

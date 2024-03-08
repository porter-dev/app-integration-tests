FROM ghcr.io/porter-dev/porter/porter-cli:latest as porter-cli
FROM ghcr.io/porter-dev/cluster-control-plane/ccp-cli:latest as ccp-cli

RUN apt update 
RUN apt install -y software-properties-common
RUN apt update 
RUN add-apt-repository -y ppa:rmescandon/yq 
RUN apt install -y gettext-base yq jq

COPY --from=porter-cli /usr/local/bin/porter /usr/local/bin/porter

COPY testdata .
